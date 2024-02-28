import * as crypto from 'crypto';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { SpotifyTask } from 'src/spotify/decorator/spotify-task.decorator';
import { SearchObjectType, SpotifySearchService } from 'src/spotify/spotify-search/spotify-search.service';
import { TrackService } from 'src/track/track.service';
import { AlbumService } from 'src/album/album.service';
import { ArtistService } from 'src/artist/artist.service';
import { PlaylistService } from 'src/playlist/playlist.service';
import { Track } from 'src/track/entities/track.entity';
import { Artist } from 'src/artist/entities/artist.entity';
import { Playlist } from 'src/playlist/entities/playlist.entity';
import { Album } from 'src/album/entities/album.entity';
import { Genre } from 'src/genre/entities/genre.entity';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class SearchService {
  private readonly SEARCH_CACHE_TTL = 1000 * 60 * 60;

  // TODO: Redis
  private readonly SEARCH_HISTORY_MAX = 20;
  private readonly searchHistory = new Map<number, string[]>();

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly spotifySearchService: SpotifySearchService,
    private readonly trackService: TrackService,
    private readonly albumService: AlbumService,
    private readonly artistService: ArtistService,
    private readonly playlistService: PlaylistService,
  ) {}

  @SpotifyTask()
  private async searchAsSpotify(keyword: string, types: SearchObjectType[], page: number) {
    const response = await this.spotifySearchService.search(keyword, types, page);

    const tracks: {
      items: Track[];
      totalPage: number;
    } = {
      items: [],
      totalPage: 1,
    };
    if (response.tracks) {
      const spotifyTracks = response.tracks;
      tracks.totalPage = spotifyTracks.total_page!;

      for (const spotifyTrack of spotifyTracks.items) {
        const album = await this.albumService.upsert({
          id: spotifyTrack.album.id,
          name: spotifyTrack.album.name,
          albumType: spotifyTrack.album.album_type,
          totalTracks: spotifyTrack.album.total_tracks,
          thumbnailUrl: spotifyTrack.album.images[0]?.url,
          releaseDate: spotifyTrack.album.release_date,
        });

        const artists = await Promise.all(
          spotifyTrack.artists.map(async (artist) => {
            return await this.artistService.upsert({
              id: artist.id,
              name: artist.name,
            });
          }),
        );

        const track = await this.trackService.upsert({
          id: spotifyTrack.id,
          name: spotifyTrack.name,
          explicit: spotifyTrack.explicit,
          discNumber: spotifyTrack.disc_number,
          trackNumber: spotifyTrack.track_number,
          duration: spotifyTrack.duration_ms,
          popularity: spotifyTrack.popularity,
          album,
          artists,
        });

        tracks.items.push(track);
      }
    }

    const albums: {
      items: Album[];
      totalPage: number;
    } = {
      items: [],
      totalPage: 1,
    };
    if (response.albums) {
      const spotifyAlbums = response.albums;
      albums.totalPage = spotifyAlbums.total_page!;

      albums.items.push(
        ...(await Promise.all(
          spotifyAlbums.items.map(async (spotifyAlbum) => {
            return await this.albumService.upsert({
              id: spotifyAlbum.id,
              name: spotifyAlbum.name,
              albumType: spotifyAlbum.album_type,
              thumbnailUrl: spotifyAlbum.images[0]?.url,
              releaseDate: spotifyAlbum.release_date,
              totalTracks: spotifyAlbum.total_tracks,
            });
          }),
        )),
      );
    }

    const artists: {
      items: Artist[];
      totalPage: number;
    } = {
      items: [],
      totalPage: 1,
    };
    if (response.artists) {
      const spotifyArtists = response.artists;
      artists.totalPage = spotifyArtists.total_page!;

      for (const spotifyArtist of spotifyArtists.items) {
        artists.items.push(
          await this.artistService.upsert({
            id: spotifyArtist.id,
            name: spotifyArtist.name,
            thumbnailUrl: spotifyArtist.images[0]?.url,
            followers: spotifyArtist.followers.total,
            popularity: spotifyArtist.popularity,
            genres: spotifyArtist.genres.map((genre) => new Genre({ name: genre })),
          }),
        );
      }
    }

    const playlists: {
      items: Playlist[];
      totalPage: number;
    } = {
      items: [],
      totalPage: 1,
    };
    if (response.playlists) {
      const spotifyPlaylists = response.playlists;
      playlists.totalPage = spotifyPlaylists.total_page!;

      playlists.items.push(
        ...(await Promise.all(
          spotifyPlaylists.items.map(async (spotifyPlaylist) => {
            return await this.playlistService.upsert({
              id: spotifyPlaylist.id,
              name: spotifyPlaylist.name,
              description: spotifyPlaylist.description,
              thumbnailUrl: spotifyPlaylist.images[0]?.url,
            });
          }),
        )),
      );
    }

    return {
      tracks,
      albums,
      artists,
      playlists,
    };
  }

  async search(keyword: string, types: SearchObjectType[], page: number) {
    const keywordHash = crypto.createHash('sha256').update(keyword).digest('hex');
    const cacheKey = `search@${keywordHash}@${types}@${page}`;
    const cachedData: string | null = await this.cacheManager.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    const searchedData = await this.searchAsSpotify(keyword, types, page);
    await this.cacheManager.set(cacheKey, JSON.stringify(searchedData), this.SEARCH_CACHE_TTL);
    return searchedData;
  }

  getSearchHistory(user: User) {
    return this.searchHistory.get(user.id) ?? [];
  }

  pushSearchHistory(user: User, keyword: string) {
    const history = this.getSearchHistory(user);
    history.unshift(keyword);
    if (history.length > this.SEARCH_HISTORY_MAX) {
      history.pop();
    }
    this.searchHistory.set(user.id, history);
    return history;
  }
}
