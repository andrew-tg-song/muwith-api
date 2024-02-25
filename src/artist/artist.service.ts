import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Artist } from './entities/artist.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { SpotifyArtistService } from 'src/spotify/spotify-artist/spotify-artist.service';
import { AlbumService } from 'src/album/album.service';
import { TrackService } from 'src/track/track.service';
import { Genre } from 'src/genre/entities/genre.entity';
import { Track } from 'src/track/entities/track.entity';
import { ArtistTopTrack } from './entities/artist-top-track.entity';
import { ArtistRelatedArtist } from './entities/artist-related-artist.entity';
import { Album } from 'src/album/entities/album.entity';
import { SpotifyTask } from 'src/spotify/decorator/spotify-task.decorator';

@Injectable()
export class ArtistService {
  private readonly ARTIST_RE_COLLECTING_PERIOD = 1000 * 60 * 60 * 24 * 1;
  private readonly ARTIST_TOP_TRACKS_RE_COLLECTING_PERIOD = 1000 * 60 * 60 * 24 * 1;
  private readonly ARTIST_RELATED_ARTISTS_RE_COLLECTING_PERIOD = 1000 * 60 * 60 * 24 * 1;

  constructor(
    @InjectRepository(Album) private readonly albumRepository: Repository<Album>,
    @InjectRepository(Artist) private readonly artistRepository: Repository<Artist>,
    @InjectRepository(ArtistTopTrack) private readonly artistTopTrackRepository: Repository<ArtistTopTrack>,
    @InjectRepository(ArtistRelatedArtist)
    private readonly artistRelatedArtistRepository: Repository<ArtistRelatedArtist>,
    private readonly spotifyArtistService: SpotifyArtistService,
    @Inject(forwardRef(() => TrackService))
    private readonly trackService: TrackService,
    @Inject(forwardRef(() => AlbumService))
    private readonly albumService: AlbumService,
  ) {}

  async upsert(artist: Partial<Artist>) {
    return await this.artistRepository.save(artist);
  }

  @SpotifyTask()
  private async updateArtistAsSpotify(artistId: string) {
    const spotifyArtist = await this.spotifyArtistService.getArtist(artistId);
    const spotifyArtistAlbums = await this.spotifyArtistService.getArtistAllAlbums(artistId);

    const artist = await this.upsert({
      id: spotifyArtist.id,
      name: spotifyArtist.name,
      thumbnailUrl: spotifyArtist.images[0]?.url,
      followers: spotifyArtist.followers.total,
      popularity: spotifyArtist.popularity,
      collectedAt: new Date(),
      genres: spotifyArtist.genres.map((genre) => new Genre({ name: genre })),
    });

    await Promise.all(
      spotifyArtistAlbums.items.map(async (spotifyAlbum) => {
        await this.albumService.upsert({
          id: spotifyAlbum.id,
          name: spotifyAlbum.name,
          albumType: spotifyAlbum.album_type,
          thumbnailUrl: spotifyAlbum.images[0]?.url,
          releaseDate: spotifyAlbum.release_date,
          totalTracks: spotifyAlbum.total_tracks,
        });
        const album = await this.albumRepository.findOne({
          where: { id: spotifyAlbum.id },
          relations: ['artists'],
        });
        const artistIndex = album.artists.findIndex((artistInAlbum) => artistInAlbum.id === artist.id);
        if (artistIndex === -1) {
          album.artists.push(artist);
          await this.albumService.upsert({
            id: album.id,
            artists: album.artists,
          });
        }
      }),
    );

    return await this.artistRepository.findOne({
      where: { id: artistId },
      relations: ['albums', 'genres'],
    });
  }

  @SpotifyTask()
  private async updateArtistTopTracksAsSpotify(artist: Artist) {
    const spotifyArtistTopTracks = await this.spotifyArtistService.getArtistTopTracks(artist.id);

    const tracks: Track[] = [];
    for (const track of spotifyArtistTopTracks.tracks) {
      const album = await this.albumService.upsert({
        id: track.album.id,
        name: track.album.name,
        albumType: track.album.album_type,
        totalTracks: track.album.total_tracks,
        thumbnailUrl: track.album.images[0]?.url,
        releaseDate: track.album.release_date,
      });

      const artists = await Promise.all(
        track.artists.map(async (artist) => {
          return await this.upsert({
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
          popularity: track.popularity,
          collectedAt: new Date(),
          album,
          artists,
        }),
      );
    }

    await this.artistTopTrackRepository.delete({ artist });
    const artistTopTracks = await Promise.all(
      tracks.map(async (track, i) => {
        const artistTopTrack = new ArtistTopTrack({
          artist,
          track,
          rank: i + 1,
        });
        return await this.artistTopTrackRepository.save(artistTopTrack);
      }),
    );

    await this.artistRepository.save({
      id: artist.id,
      collectedTopTracksAt: new Date(),
    });

    return artistTopTracks;
  }

  @SpotifyTask()
  private async updateArtistRelatedArtistsAsSpotify(artist: Artist) {
    const spotifyArtistRelatedArtists = await this.spotifyArtistService.getArtistRelatedArtist(artist.id);

    const arrivalArtists: Artist[] = [];
    for (const spotifyArtist of spotifyArtistRelatedArtists.artists) {
      const arrivalArtist = await this.upsert({
        id: spotifyArtist.id,
        name: spotifyArtist.name,
        thumbnailUrl: spotifyArtist.images[0]?.url,
        followers: spotifyArtist.followers.total,
        popularity: spotifyArtist.popularity,
        genres: spotifyArtist.genres.map((genre) => new Genre({ name: genre })),
      });
      arrivalArtists.push(arrivalArtist);
    }

    await this.artistRelatedArtistRepository.delete({ departureArtist: artist });
    const artistRelatedArtists = await Promise.all(
      arrivalArtists.map(async (arrivalArtist, i) => {
        const artistRelatedArtist = new ArtistRelatedArtist({
          departureArtist: artist,
          arrivalArtist,
          rank: i + 1,
        });
        return await this.artistRelatedArtistRepository.save(artistRelatedArtist);
      }),
    );

    await this.artistRepository.save({
      id: artist.id,
      collectedRelatedArtistsAt: new Date(),
    });

    return artistRelatedArtists;
  }

  async getArtist(artistId: string) {
    let artist = await this.artistRepository.findOne({
      where: { id: artistId },
      relations: ['albums', 'genres'],
    });
    if (
      artist == null ||
      artist.collectedAt == null ||
      Date.now() > artist.collectedAt.getTime() + this.ARTIST_RE_COLLECTING_PERIOD
    ) {
      artist = await this.updateArtistAsSpotify(artistId);
    }
    return artist as Required<Artist>;
  }

  async getArtistTopTracks(artistId: string) {
    const artist = await this.getArtist(artistId);
    if (
      artist.collectedTopTracksAt == null ||
      Date.now() > artist.collectedTopTracksAt.getTime() + this.ARTIST_TOP_TRACKS_RE_COLLECTING_PERIOD
    ) {
      const artistTopTracks = await this.updateArtistTopTracksAsSpotify(artist);
      return artistTopTracks.map((artistTopTrack) => artistTopTrack.track);
    }
    const artistTopTracks = await this.artistTopTrackRepository.find({
      where: { artist: { id: artist.id } },
      order: { rank: 'asc' },
      relations: ['track'],
    });
    return artistTopTracks.map((artistTopTrack) => artistTopTrack.track);
  }

  async getArtistRelatedArtists(artistId: string) {
    const artist = await this.getArtist(artistId);
    if (
      artist.collectedRelatedArtistsAt == null ||
      Date.now() > artist.collectedRelatedArtistsAt.getTime() + this.ARTIST_RELATED_ARTISTS_RE_COLLECTING_PERIOD
    ) {
      const artistRelatedArtists = await this.updateArtistRelatedArtistsAsSpotify(artist);
      return artistRelatedArtists.map((artistRelatedArtist) => artistRelatedArtist.arrivalArtist);
    }
    const artistRelatedArtists = await this.artistRelatedArtistRepository.find({
      where: { departureArtist: { id: artist.id } },
      order: { rank: 'asc' },
      relations: ['arrivalArtist'],
    });
    return artistRelatedArtists.map((artistRelatedArtist) => artistRelatedArtist.arrivalArtist);
  }
}
