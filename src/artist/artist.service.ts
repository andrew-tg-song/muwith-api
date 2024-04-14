import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Artist } from './entities/artist.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ArtistAlbumGroup, SpotifyArtistService } from 'src/spotify/spotify-artist/spotify-artist.service';
import { AlbumService } from 'src/album/album.service';
import { TrackService } from 'src/track/track.service';
import { Genre } from 'src/genre/entities/genre.entity';
import { Track } from 'src/track/entities/track.entity';
import { ArtistTopTrack } from './entities/artist-top-track.entity';
import { ArtistRelatedArtist } from './entities/artist-related-artist.entity';
import { SpotifyTask } from 'src/spotify/decorator/spotify-task.decorator';
import { ArtistAlbum } from './entities/artist-album.entity';
import { getHighestResolutionImage } from 'src/spotify/utility/get-highest-resolution-image.utility';
import { Album } from '../album/entities/album.entity';

@Injectable()
export class ArtistService {
  private readonly ARTIST_RE_COLLECTING_PERIOD = 1000 * 60 * 60 * 24 * 365;
  private readonly ARTIST_TOP_TRACKS_RE_COLLECTING_PERIOD = 1000 * 60 * 60 * 24 * 365;
  private readonly ARTIST_RELATED_ARTISTS_RE_COLLECTING_PERIOD = 1000 * 60 * 60 * 24 * 365;

  constructor(
    @InjectRepository(Artist) private readonly artistRepository: Repository<Artist>,
    @InjectRepository(ArtistAlbum) private readonly artistAlbumRepository: Repository<ArtistAlbum>,
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
  private async updateArtistAsSpotify(artistId: string, albumGroup: ArtistAlbumGroup) {
    const spotifyArtist = await this.spotifyArtistService.getArtist(artistId);
    const spotifyArtistAlbums = await this.spotifyArtistService.getArtistAllAlbums(artistId, albumGroup);

    const newArtist = new Artist({
      id: spotifyArtist.id,
      name: spotifyArtist.name,
      thumbnailUrl: getHighestResolutionImage(spotifyArtist.images)?.url,
      followers: spotifyArtist.followers.total,
      popularity: spotifyArtist.popularity,
      genres: spotifyArtist.genres.map((genre) => new Genre({ name: genre })),
    });
    switch (albumGroup) {
      case 'direct':
        newArtist.collectedDirectAlbumsAt = new Date();
        break;
      case 'indirect':
        newArtist.collectedIndirectAlbumsAt = new Date();
        break;
      case 'both':
        newArtist.collectedDirectAlbumsAt = new Date();
        newArtist.collectedIndirectAlbumsAt = new Date();
        break;
    }
    const artist = await this.upsert(newArtist);

    const artistAlbumsDeleteCriteria: FindOptionsWhere<ArtistAlbum> = {
      artist: { id: artist.id },
    };
    if (albumGroup !== 'both') {
      artistAlbumsDeleteCriteria.albumGroup = albumGroup;
    }
    await this.artistAlbumRepository.delete(artistAlbumsDeleteCriteria);
    await Promise.all(
      spotifyArtistAlbums.items.map(async (spotifyAlbum) => {
        const album = await this.albumService.upsert({
          id: spotifyAlbum.id,
          name: spotifyAlbum.name,
          albumType: spotifyAlbum.album_type,
          thumbnailUrl: getHighestResolutionImage(spotifyAlbum.images)?.url,
          releaseDate: spotifyAlbum.release_date,
          totalTracks: spotifyAlbum.total_tracks,
        });
        const artistAlbum = new ArtistAlbum({
          artist,
          album,
          albumGroup: album.albumType === 'compilation' ? 'indirect' : 'direct',
        });
        await this.artistAlbumRepository.save(artistAlbum);
      }),
    );

    return artist;
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
        thumbnailUrl: getHighestResolutionImage(track.album.images)?.url,
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
          album,
          artists,
        }),
      );
    }

    await this.artistTopTrackRepository.delete({ artist: { id: artist.id } });
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
        thumbnailUrl: getHighestResolutionImage(spotifyArtist.images)?.url,
        followers: spotifyArtist.followers.total,
        popularity: spotifyArtist.popularity,
        genres: spotifyArtist.genres.map((genre) => new Genre({ name: genre })),
      });
      arrivalArtists.push(arrivalArtist);
    }

    await this.artistRelatedArtistRepository.delete({ departureArtist: { id: artist.id } });
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

  async getArtists(artistIds: string[], albumGroup: ArtistAlbumGroup = 'direct') {
    if (artistIds.length === 0) {
      return new Map<string, Artist & { albums?: Album[] }>();
    }
    const artists = await this.artistRepository.find({
      where: artistIds.map((artistId) => ({ id: artistId })),
      relations: ['genres'],
    });
    const artistMap = new Map<string, Artist & { albums?: Album[] }>();
    for (const artist of artists) {
      artistMap.set(artist.id, artist);
    }
    for (const artistId of artistIds) {
      let artist = artistMap.get(artistId);
      if (
        artist == null ||
        ((albumGroup === 'direct' || albumGroup === 'both') &&
          (artist.collectedDirectAlbumsAt == null ||
            Date.now() > artist.collectedDirectAlbumsAt.getTime() + this.ARTIST_RE_COLLECTING_PERIOD)) ||
        ((albumGroup === 'indirect' || albumGroup === 'both') &&
          (artist.collectedIndirectAlbumsAt == null ||
            Date.now() > artist.collectedIndirectAlbumsAt.getTime() + this.ARTIST_RE_COLLECTING_PERIOD))
      ) {
        artist = await this.updateArtistAsSpotify(artistId, albumGroup);
      }
      const artistAlbumsFindCriteria: FindOptionsWhere<ArtistAlbum> = {
        artist: { id: artist.id },
      };
      if (albumGroup !== 'both') {
        artistAlbumsFindCriteria.albumGroup = albumGroup;
      }
      const artistAlbums = await this.artistAlbumRepository.find({
        where: artistAlbumsFindCriteria,
        relations: ['album'],
      });
      artistMap.set(artist.id, {
        ...(artist as Required<Artist>),
        albums: artistAlbums.map((artistAlbum) => artistAlbum.album),
      });
    }
    return artistMap;
  }

  async getArtist(artistId: string, albumGroup: ArtistAlbumGroup = 'direct') {
    const artistMap = await this.getArtists([artistId], albumGroup);
    return artistMap.get(artistId);
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
      relations: { track: { album: true, artists: true } },
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
