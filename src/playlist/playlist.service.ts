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

@Injectable()
export class PlaylistService {
  private readonly PLAYLIST_RE_COLLECTING_PERIOD = 1000 * 60 * 60 * 24 * 1;
  private readonly PLAYLIST_SETS_RE_COLLECTING_PERIOD = 1000 * 60 * 60 * 24 * 1;
  private readonly PLAYLIST_SET_PLAYLISTS_RE_COLLECTING_PERIOD = 1000 * 60 * 60 * 24 * 1;

  constructor(
    @InjectRepository(Playlist) private readonly playlistRepository: Repository<Playlist>,
    @InjectRepository(PlaylistTrack) private readonly playlistTrackRepository: Repository<PlaylistTrack>,
    @InjectRepository(PlaylistSet) private readonly playlistSetRepository: Repository<PlaylistSet>,
    @InjectRepository(PlaylistSetPlaylist)
    private readonly playlistSetPlaylistRepository: Repository<PlaylistSetPlaylist>,
    private readonly spotifyPlaylistService: SpotifyPlaylistService,
    private readonly trackService: TrackService,
    private readonly albumService: AlbumService,
    private readonly artistService: ArtistService,
  ) {}

  async upsert(playlist: Partial<Playlist>) {
    return await this.playlistRepository.save(playlist);
  }

  private async updatePlaylistAsSpotify(playlistId: string) {
    const spotifyPlaylist = await this.spotifyPlaylistService.getPlaylist(playlistId);

    const playlist = await this.upsert({
      id: spotifyPlaylist.id,
      name: spotifyPlaylist.name,
      description: spotifyPlaylist.description,
      followers: spotifyPlaylist.followers.total,
      thumbnailUrl: spotifyPlaylist.images[0]?.url,
      collectedAt: new Date(),
    });

    const tracks: Track[] = [];
    for (const spotifyTrack of spotifyPlaylist.tracks.items) {
      const track = spotifyTrack.track;
      console.info(spotifyTrack);
      if (track.episode) {
        continue;
      }
      const albumArtists = await Promise.all(
        track.album.artists.map(async (artist) => {
          return await this.artistService.upsert({
            id: artist.id,
            name: artist.name,
          });
        }),
      );
      const album = await this.albumService.upsert({
        id: track.album.id,
        name: track.album.name,
        albumType: track.album.album_type,
        totalTracks: track.album.total_tracks,
        thumbnailUrl: track.album.images[0]?.url,
        releaseDate: track.album.release_date,
        artists: albumArtists,
      });
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
    }

    await this.playlistTrackRepository.delete({ playlist: { id: playlist.id } });
    await Promise.all(
      tracks.map(async (track, i) => {
        const playlistTrack = new PlaylistTrack({
          playlist,
          track,
          order: i + 1,
        });
        return await this.playlistTrackRepository.save(playlistTrack);
      }),
    );

    console.info(tracks);

    return {
      ...playlist,
      tracks,
    };
  }

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
        thumbnailUrl: spotifyPlaylist.images[0]?.url,
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
    const playlist = await this.playlistRepository.findOne({ where: { id: playlistId } });
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
      tracks: playlistTracks.map((playlistTrack) => playlistTrack.track),
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
