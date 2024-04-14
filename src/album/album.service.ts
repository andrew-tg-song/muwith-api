import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Album } from './entities/album.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { TrackService } from 'src/track/track.service';
import { SpotifyAlbumService } from 'src/spotify/spotify-album/spotify-album.service';
import { ArtistService } from 'src/artist/artist.service';
import { Genre } from 'src/genre/entities/genre.entity';
import { Track } from 'src/track/entities/track.entity';
import { SpotifyTask } from 'src/spotify/decorator/spotify-task.decorator';
import { ArtistAlbum } from '../artist/entities/artist-album.entity';
import { getHighestResolutionImage } from 'src/spotify/utility/get-highest-resolution-image.utility';
import { Artist } from '../artist/entities/artist.entity';

@Injectable()
export class AlbumService {
  private readonly ALBUM_RE_COLLECTING_PERIOD = 1000 * 60 * 60 * 24 * 365;

  constructor(
    @InjectRepository(Album) private readonly albumRepository: Repository<Album>,
    @InjectRepository(ArtistAlbum) private readonly artistAlbumRepository: Repository<ArtistAlbum>,
    private readonly spotifyAlbumService: SpotifyAlbumService,
    @Inject(forwardRef(() => TrackService))
    private readonly trackService: TrackService,
    @Inject(forwardRef(() => ArtistService))
    private readonly artistService: ArtistService,
  ) {}

  async upsert(album: Partial<Album>) {
    return await this.albumRepository.save(album);
  }

  @SpotifyTask()
  private async updateAlbumAsSpotify(albumId: string) {
    const spotifyAlbum = await this.spotifyAlbumService.getAlbum(albumId);
    const spotifyAlbumTracks = await this.spotifyAlbumService.getAlbumAllTracks(albumId);

    const tracks: Track[] = [];
    for (const track of spotifyAlbumTracks.items) {
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
          artists,
        }),
      );
    }

    const artists = await Promise.all(
      spotifyAlbum.artists.map(async (artist) => {
        return await this.artistService.upsert({
          id: artist.id,
          name: artist.name,
        });
      }),
    );

    const album = await this.upsert({
      id: spotifyAlbum.id,
      name: spotifyAlbum.name,
      albumType: spotifyAlbum.album_type,
      totalTracks: spotifyAlbum.total_tracks,
      thumbnailUrl: getHighestResolutionImage(spotifyAlbum.images)?.url,
      releaseDate: spotifyAlbum.release_date,
      copyright: spotifyAlbum.copyrights.find((v) => v.type === 'C')?.text,
      recordingCopyright: spotifyAlbum.copyrights.find((v) => v.type === 'P')?.text,
      label: spotifyAlbum.label,
      popularity: spotifyAlbum.popularity,
      collectedAt: new Date(),
      tracks,
      genres: spotifyAlbum.genres.map((genre) => new Genre({ name: genre })),
    });

    await Promise.all(
      artists.map(async (artist) => {
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

    return album;
  }

  async getAlbums(albumIds: string[]) {
    if (albumIds.length === 0) {
      return new Map<string, Album & { artists?: Artist[] }>();
    }
    const albums = await this.albumRepository.find({
      where: albumIds.map((albumId) => ({ id: albumId })),
      relations: { tracks: { artists: true }, genres: true },
    });
    const albumMap = new Map<string, Album & { artists?: Artist[] }>();
    for (const album of albums) {
      albumMap.set(album.id, album);
    }
    for (const albumId of albumIds) {
      let album = albumMap.get(albumId);
      if (
        album == null ||
        album.collectedAt == null ||
        Date.now() > album.collectedAt.getTime() + this.ALBUM_RE_COLLECTING_PERIOD
      ) {
        album = await this.updateAlbumAsSpotify(albumId);
      }
      const artistAlbums = await this.artistAlbumRepository.find({
        where: {
          album: { id: album.id },
        },
        relations: ['artist'],
      });
      albumMap.set(albumId, {
        ...(album as Required<Album>),
        artists: artistAlbums.map((artistAlbum) => artistAlbum.artist),
      });
    }
    return albumMap;
  }

  async getAlbum(albumId: string) {
    const trackMap = await this.getAlbums([albumId]);
    return trackMap.get(albumId);
  }
}
