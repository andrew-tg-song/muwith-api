import { v4 as uuidv4, v4 } from 'uuid';
import { ForbiddenException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Playlist } from './entities/playlist.entity';
import { MoreThan, Repository } from 'typeorm';
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
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { User } from '../user/entities/user.entity';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';
import { UpdatePlaylistTrackDto } from './dto/update-playlist-track.dto';
import { LikeService } from '../like/like.service';
import { ObjectType } from '../constants';
import { S3Service } from '../aws/s3/s3.service';

@Injectable()
export class PlaylistService {
  private readonly PLAYLIST_RE_COLLECTING_PERIOD = 1000 * 60 * 60 * 24 * 365;
  private readonly PLAYLIST_SETS_RE_COLLECTING_PERIOD = 1000 * 60 * 60 * 24 * 365;
  private readonly PLAYLIST_SET_PLAYLISTS_RE_COLLECTING_PERIOD = 1000 * 60 * 60 * 24 * 365;

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
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => LikeService))
    private readonly likeService: LikeService,
    private readonly s3Service: S3Service,
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

  async getPlaylists(playlistIds: string[]) {
    const playlists = await this.playlistRepository.find({
      where: playlistIds.map((playlistId) => ({ id: playlistId })),
      relations: ['owner'],
    });
    const playlistMap = new Map<string, Playlist & { tracks?: Track[] }>();
    for (const playlist of playlists) {
      playlistMap.set(playlist.id, playlist);
    }
    for (const playlistId of playlistIds) {
      let playlist = playlistMap.get(playlistId);
      if (
        playlist == null ||
        (playlist.notCollect == false &&
          (playlist.collectedAt == null ||
            Date.now() > playlist.collectedAt.getTime() + this.PLAYLIST_RE_COLLECTING_PERIOD))
      ) {
        playlist = await this.updatePlaylistAsSpotify(playlistId);
      }
      const playlistTracks = await this.playlistTrackRepository.find({
        where: { playlist: { id: playlist.id } },
        relations: { track: { album: true, artists: true } },
        order: { order: 'asc' },
      });
      playlistMap.set(playlist.id, {
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
      });
    }
    return playlistMap;
  }

  async getPlaylist(playlistId: string) {
    const playlistMap = await this.getPlaylists([playlistId]);
    return playlistMap.get(playlistId);
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

  async getUserPlaylists(userId: number) {
    const playlists = await this.playlistRepository.find({
      where: {
        owner: {
          id: userId,
        },
      },
    });
    return await this.getPlaylists(playlists.map((playlist) => playlist.id));
  }

  async createPlaylist(user: User, dto: CreatePlaylistDto) {
    const tracks = await this.trackService.getTracks(dto.tracks);
    const playlistId = uuidv4();
    const playlist = new Playlist({
      id: playlistId,
      name: dto.name,
      description: dto.description,
      followers: 0,
      owner: user,
      notCollect: true,
    });
    await this.playlistRepository.save(playlist);
    const playlistTracks = Array.from(tracks.values()).map((track, i) => {
      return new PlaylistTrack({
        playlist,
        track,
        addedAt: new Date(),
        order: i,
      });
    });
    await this.playlistTrackRepository.save(playlistTracks);
  }

  async updatePlaylist(user: User, id: string, dto: UpdatePlaylistDto) {
    const playlist = await this.getPlaylist(id);
    if (playlist == null) {
      throw new NotFoundException();
    }
    if (playlist.owner.id !== user.id) {
      throw new ForbiddenException();
    }
    if (dto.name) {
      playlist.name = dto.name;
    }
    if (dto.description) {
      playlist.description = dto.description;
    }
    await this.playlistRepository.save(playlist);
  }

  async deletePlaylist(user: User, id: string) {
    const playlist = await this.getPlaylist(id);
    if (playlist == null) {
      throw new NotFoundException();
    }
    if (playlist.owner.id !== user.id) {
      throw new ForbiddenException();
    }
    await this.likeService.deleteLikes(ObjectType.PLAYLIST, id);
    await this.playlistRepository.delete({ id: playlist.id });
  }

  private async sortTrackOrder(startOrder: number, playlistTrackId: number[]) {
    for (let i = 0; i < playlistTrackId.length; ++i) {
      const playlistTrack = await this.playlistTrackRepository.findOneBy({
        id: playlistTrackId[i],
      });
      playlistTrack.order = startOrder + i;
      await this.playlistTrackRepository.save(playlistTrack);
    }
  }

  async addTrack(user: User, id: string, trackId: string) {
    const playlist = await this.getPlaylist(id);
    if (playlist == null) {
      throw new NotFoundException();
    }
    if (playlist.owner.id !== user.id) {
      throw new ForbiddenException();
    }
    const track = await this.trackService.getTrack(trackId);

    const lastPlaylistTrack = await this.playlistTrackRepository.findOne({
      where: {
        playlist: { id },
      },
      order: {
        order: 'desc',
      },
    });
    const order = lastPlaylistTrack ? lastPlaylistTrack.order + 1 : 0;
    const playlistTrack = new PlaylistTrack({
      playlist,
      track,
      addedAt: new Date(),
      order,
    });
    await this.playlistTrackRepository.save(playlistTrack);
  }

  async deleteTrack(user: User, id: string, trackId: string) {
    const playlist = await this.getPlaylist(id);
    if (playlist == null) {
      throw new NotFoundException();
    }
    if (playlist.owner.id !== user.id) {
      throw new ForbiddenException();
    }

    const playlistTrack = await this.playlistTrackRepository.findOne({
      where: {
        playlist: { id },
        track: { id: trackId },
      },
    });
    if (playlistTrack == null) {
      throw new NotFoundException();
    }
    const playlistTracksForSort = await this.playlistTrackRepository.find({
      where: {
        playlist: { id },
        order: MoreThan(playlistTrack.order),
      },
      order: { order: 'asc' },
    });
    await this.sortTrackOrder(
      playlistTrack.order,
      playlistTracksForSort.map((track) => track.id),
    );
    await this.playlistTrackRepository.delete(playlistTrack);
  }

  async updateTrack(user: User, id: string, trackId: string, dto: UpdatePlaylistTrackDto) {
    const playlist = await this.getPlaylist(id);
    if (playlist == null) {
      throw new NotFoundException();
    }
    if (playlist.owner.id !== user.id) {
      throw new ForbiddenException();
    }

    const playlistTrack = await this.playlistTrackRepository.findOne({
      where: {
        playlist: { id },
        track: { id: trackId },
      },
    });
    if (playlistTrack == null) {
      throw new NotFoundException();
    }

    const playlistTracksForSort = (
      await this.playlistTrackRepository.find({
        where: {
          playlist: { id },
        },
        order: { order: 'asc' },
      })
    )
      .map((track) => track.id)
      .filter((id) => {
        return id !== playlistTrack.id;
      });
    playlistTracksForSort.splice(dto.order, 0, playlistTrack.id);
    await this.sortTrackOrder(0, playlistTracksForSort);
  }

  async uploadThumbnailImage(user: User, id: string, file: Buffer, fileExt: string) {
    const playlist = await this.getPlaylist(id);
    if (playlist == null) {
      throw new NotFoundException();
    }
    if (playlist.owner.id !== user.id) {
      throw new ForbiddenException();
    }

    const fileName = v4() + fileExt;
    const response = await this.s3Service.publicUpload(file, fileName);
    playlist.thumbnailUrl = response.objectUrl;
    return await this.upsert(playlist);
  }
}
