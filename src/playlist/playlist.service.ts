import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Playlist } from './entities/playlist.entity';
import { Repository } from 'typeorm';
import { SpotifyPlaylistService } from 'src/spotify/spotify-playlist/spotify-playlist.service';
import { PlaylistTrack } from './entities/playlist-track.entity';
import { Track } from 'src/track/entities/track.entity';
import { TrackService } from 'src/track/track.service';
import { ArtistService } from 'src/artist/artist.service';
import { AlbumService } from 'src/album/album.service';
import { PlaylistSet } from './entities/playlist-set.entity';
import { PlaylistSetPlaylist } from './entities/playlist-set-playlist.entity';
import { SpotifyTask } from 'src/spotify/decorator/spotify-task.decorator';
import { ArtistAlbum } from '../artist/entities/artist-album.entity';
import { getHighestResolutionImage } from 'src/spotify/utility/get-highest-resolution-image.utility';
import { UserService } from 'src/user/user.service';
import { SpotifyUserService } from 'src/spotify/spotify-user/spotify-user.service';
import { Artist } from 'src/artist/entities/artist.entity';

@Injectable()
export class PlaylistService {
  private readonly PLAYLIST_RE_COLLECTING_PERIOD = 1000 * 60 * 60 * 24 * 1;
  private readonly PLAYLIST_SETS_RE_COLLECTING_PERIOD = 1000 * 60 * 60 * 24 * 1;
  private readonly PLAYLIST_SET_PLAYLISTS_RE_COLLECTING_PERIOD = 1000 * 60 * 60 * 24 * 1;

  constructor(
    @InjectRepository(ArtistAlbum) private readonly artistAlbumRepository: Repository<ArtistAlbum>,
    @InjectRepository(Playlist) private readonly playlistRepository: Repository<Playlist>,
    @InjectRepository(PlaylistTrack) private readonly playlistTrackRepository: Repository<PlaylistTrack>,
    @InjectRepository(PlaylistSet) private readonly playlistSetRepository: Repository<PlaylistSet>,
    @InjectRepository(PlaylistSetPlaylist)
    private readonly playlistSetPlaylistRepository: Repository<PlaylistSetPlaylist>,
    private readonly spotifyPlaylistService: SpotifyPlaylistService,
    private readonly spotifyUserService: SpotifyUserService,
    private readonly trackService: TrackService,
    private readonly albumService: AlbumService,
    private readonly artistService: ArtistService,
    private readonly userService: UserService,
  ) {}

  async upsert(playlist: Partial<Playlist>) {
    return await this.playlistRepository.save(playlist);
  }

  @SpotifyTask()
  private async updatePlaylistAsSpotify(playlistId: string) {
    const spotifyPlaylist = await this.spotifyPlaylistService.getPlaylist(playlistId);
    const spotifyUser = await this.spotifyUserService.getUser(spotifyPlaylist.owner.id);

    let owner = await this.userService.findOneByLoginId(`spotify:${spotifyUser.id}`);
    if (owner) {
      owner = await this.userService.upsert({
        ...owner,
        name: spotifyUser.display_name ?? owner.name,
        profileImage: getHighestResolutionImage(spotifyUser.images)?.url ?? owner.profileImage,
      });
    } else {
      owner = await this.userService.create({
        loginId: `spotify:${spotifyUser.id}`,
        name: spotifyUser.display_name ?? 'spotify',
        profileImage: getHighestResolutionImage(spotifyUser.images)?.url,
      });
    }

    const playlist = await this.upsert({
      id: spotifyPlaylist.id,
      name: spotifyPlaylist.name,
      description: spotifyPlaylist.description,
      followers: spotifyPlaylist.followers.total,
      thumbnailUrl: getHighestResolutionImage(spotifyPlaylist.images)?.url,
      owner,
      collectedAt: new Date(),
    });

    const tracks: Track[] = [];
    const trackAddedAtMap = new Map<string, Date | null>();
    const artistInAlbumMap = new Map<string, Partial<Artist>[]>();
    for (const spotifyTrack of spotifyPlaylist.tracks.items) {
      const track = spotifyTrack.track;
      if (track.type !== 'track') {
        continue;
      }
      const artistsInAlbum = await Promise.all(
        track.album.artists.map(async (artist) => {
          return await this.artistService.upsert({
            id: artist.id,
            name: artist.name,
          });
        }),
      );
      artistInAlbumMap.set(track.album.id, artistsInAlbum);
      const album = await this.albumService.upsert({
        id: track.album.id,
        name: track.album.name,
        albumType: track.album.album_type,
        totalTracks: track.album.total_tracks,
        thumbnailUrl: getHighestResolutionImage(track.album.images)?.url,
        releaseDate: track.album.release_date,
      });
      await Promise.all(
        artistsInAlbum.map(async (artist) => {
          // Avoid duplicate creation
          const artistAlbum = await this.artistAlbumRepository.findOne({
            where: {
              artist: { id: artist.id },
              album: { id: album.id },
            },
            relations: ['artist'],
          });
          if (!artistAlbum) {
            const artistAlbum = new ArtistAlbum({
              artist,
              album,
              albumGroup: album.albumType === 'compilation' ? 'indirect' : 'direct',
            });
            await this.artistAlbumRepository.save(artistAlbum);
          }
        }),
      );
      const artists = await Promise.all(
        track.artists.map(async (artist) => {
          return await this.artistService.upsert({
            id: artist.id,
            name: artist.name,
          });
        }),
      );
      tracks.push(
        await this.trackService.upsert({
          id: track.id,
          name: track.name,
          explicit: track.explicit,
          discNumber: track.disc_number,
          trackNumber: track.track_number,
          duration: track.duration_ms,
          album,
          artists,
        }),
      );
      trackAddedAtMap.set(track.id, spotifyTrack.added_at ? new Date(spotifyTrack.added_at) : null);
    }

    await this.playlistTrackRepository.delete({ playlist: { id: playlist.id } });
    await Promise.all(
      tracks.map(async (track, i) => {
        const playlistTrack = new PlaylistTrack({
          playlist,
          track,
          addedAt: trackAddedAtMap.get(track.id),
          order: i + 1,
        });
        return await this.playlistTrackRepository.save(playlistTrack);
      }),
    );

    return {
      ...playlist,
      tracks: tracks.map((track) => {
        return {
          ...track,
          album: {
            ...track.album,
            artists: artistInAlbumMap.get(track.album.id),
          },
          addedAt: trackAddedAtMap.get(track.id),
        };
      }),
    };
  }

  @SpotifyTask()
  private async updatePlaylistSetsAsSpotify() {
    const spotifyPlaylistSets = await this.spotifyPlaylistService.getAllPlaylistSets();

    return await Promise.all(
      spotifyPlaylistSets.categories.items.map(async (spotifyPlaylistSet, i) => {
        const playlistSet = new PlaylistSet({
          id: spotifyPlaylistSet.id,
          name: spotifyPlaylistSet.name,
          thumbnailUrl: spotifyPlaylistSet.icons[0]?.url,
          order: i + 1,
          collectedAt: new Date(),
        });
        return await this.playlistSetRepository.save(playlistSet);
      }),
    );
  }

  @SpotifyTask()
  private async updatePlaylistSetPlaylistsAsSpotify(playlistSet: PlaylistSet) {
    const spotifyPlaylistSetPlaylists = await this.spotifyPlaylistService.getAllPlaylistSetPlaylists(playlistSet.id);

    await this.playlistSetPlaylistRepository.delete({ playlistSet: { id: playlistSet.id } });
    const playlistSetPlaylists: PlaylistSetPlaylist[] = [];
    for (const i in spotifyPlaylistSetPlaylists.playlists.items) {
      const spotifyPlaylist = spotifyPlaylistSetPlaylists.playlists.items[i];
      const playlist = await this.upsert({
        id: spotifyPlaylist.id,
        name: spotifyPlaylist.name,
        description: spotifyPlaylist.description,
        thumbnailUrl: getHighestResolutionImage(spotifyPlaylist.images)?.url,
      });
      const playlistSetPlaylist = new PlaylistSetPlaylist({
        playlistSet,
        playlist,
        order: Number(i) + 1,
      });
      playlistSetPlaylists.push(await this.playlistSetPlaylistRepository.save(playlistSetPlaylist));
    }

    playlistSet.collectedPlaylistsAt = new Date();
    await this.playlistSetRepository.save(playlistSet);

    return playlistSetPlaylists.map((playlistSetPlaylist) => playlistSetPlaylist.playlist);
  }

  async getPlaylist(playlistId: string) {
    const playlist = await this.playlistRepository.findOne({
      where: { id: playlistId },
      relations: ['owner'],
    });
    if (
      playlist == null ||
      playlist.collectedAt == null ||
      Date.now() > playlist.collectedAt.getTime() + this.PLAYLIST_RE_COLLECTING_PERIOD
    ) {
      return await this.updatePlaylistAsSpotify(playlistId);
    }
    const playlistTracks = await this.playlistTrackRepository.find({
      where: { playlist: { id: playlist.id } },
      relations: { track: { album: true, artists: true } },
      order: { order: 'asc' },
    });
    return {
      ...(playlist as Required<Playlist>),
      tracks: await Promise.all(
        playlistTracks.map(async (playlistTrack) => {
          const track = playlistTrack.track;
          const artistAlbumsInAlbum = await this.artistAlbumRepository.find({
            where: {
              album: { id: track.album.id },
            },
            relations: ['artist'],
          });
          return {
            ...track,
            album: {
              ...track.album,
              artists: artistAlbumsInAlbum.map((artistAlbum) => artistAlbum.artist),
            },
            addedAt: playlistTrack.addedAt,
          };
        }),
      ),
    };
  }

  async getPlaylistSets() {
    let playlistSets = await this.playlistSetRepository.find({ order: { order: 'asc' } });
    const playlistSet = playlistSets[0];
    if (
      playlistSet == null ||
      playlistSet.collectedAt == null ||
      Date.now() > playlistSet.collectedAt.getTime() + this.PLAYLIST_SETS_RE_COLLECTING_PERIOD
    ) {
      playlistSets = await this.updatePlaylistSetsAsSpotify();
    }
    return playlistSets;
  }

  async getPlaylistSetPlaylists(playlistSetId: string) {
    const playlistSet = await this.playlistSetRepository.findOne({ where: { id: playlistSetId } });
    if (playlistSet == null) {
      throw new NotFoundException('The playlist set not found.');
    }

    if (
      playlistSet.collectedPlaylistsAt == null ||
      Date.now() > playlistSet.collectedPlaylistsAt.getTime() + this.PLAYLIST_SET_PLAYLISTS_RE_COLLECTING_PERIOD
    ) {
      return await this.updatePlaylistSetPlaylistsAsSpotify(playlistSet);
    }
    const playlistSetPlaylists = await this.playlistSetPlaylistRepository.find({
      where: { playlistSet: { id: playlistSet.id } },
      relations: ['playlist'],
      order: { order: 'asc' },
    });
    return playlistSetPlaylists.map((playlistSetPlaylist) => playlistSetPlaylist.playlist);
  }
}
