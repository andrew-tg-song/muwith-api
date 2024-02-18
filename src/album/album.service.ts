import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Album } from './entities/album.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { TrackService } from 'src/track/track.service';
import { SpotifyAlbumService } from 'src/spotify/spotify-album/spotify-album.service';
import { ArtistService } from 'src/artist/artist.service';
import { Genre } from 'src/genre/entities/genre.entity';
import { Track } from 'src/track/entities/track.entity';

@Injectable()
export class AlbumService {
  private readonly ALBUM_RE_COLLECTING_PERIOD = 1000 * 60 * 60 * 24 * 7;

  constructor(
    @InjectRepository(Album) private readonly albumRepository: Repository<Album>,
    private readonly spotifyAlbumService: SpotifyAlbumService,
    @Inject(forwardRef(() => TrackService))
    private readonly trackService: TrackService,
    private readonly artistService: ArtistService,
  ) {}

  async upsert(album: Partial<Album>) {
    return await this.albumRepository.save(album);
  }

  async updateAlbumAsSpotify(albumId: string) {
    const spotifyAlbum = await this.spotifyAlbumService.getAlbum(albumId);

    const tracks: Track[] = [];
    for (const track of spotifyAlbum.tracks.items) {
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

    return await this.upsert({
      id: spotifyAlbum.id,
      name: spotifyAlbum.name,
      albumType: spotifyAlbum.album_type,
      totalTracks: spotifyAlbum.total_tracks,
      thumbnailUrl: spotifyAlbum.images[0]?.url,
      releaseDate: spotifyAlbum.release_date,
      copyright: spotifyAlbum.copyrights.find((v) => v.type === 'C')?.text,
      recordingCopyright: spotifyAlbum.copyrights.find((v) => v.type === 'P')?.text,
      label: spotifyAlbum.label,
      popularity: spotifyAlbum.popularity,
      collectedAt: new Date(),
      tracks,
      artists,
      genres: spotifyAlbum.genres.map((genre) => new Genre({ name: genre })),
    });
  }

  async getAlbum(albumId: string) {
    let album = await this.albumRepository.findOne({
      where: { id: albumId },
      relations: ['tracks', 'artists', 'genres'],
    });
    if (album == null || Date.now() > album.collectedAt.getTime() + this.ALBUM_RE_COLLECTING_PERIOD) {
      album = await this.updateAlbumAsSpotify(albumId);
    }
    return album as Required<Album>;
  }

  // For debug
  async getAlbums() {
    return await this.albumRepository.find();
  }
}
