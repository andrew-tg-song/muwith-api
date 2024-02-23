import { Injectable } from '@nestjs/common';
import { SpotifyClientService } from '../spotify-client/spotify-client.service';
import { GetArtistResponse } from './interface/get-artist-response';
import { GetArtistAlbumsResponse } from './interface/get-artist-albums-response';
import { GetArtistTopTracksResponse } from './interface/get-artist-top-tracks-response';
import { GetArtistRelatedArtistsResponse } from './interface/get-artist-related-artists-response';

@Injectable()
export class SpotifyArtistService {
  constructor(private readonly spotifyClientService: SpotifyClientService) {}

  async getArtist(artistId: string) {
    return await this.spotifyClientService.get<GetArtistResponse>(`/artists/${artistId}`, { market: 'KR' });
  }

  async getArtistAlbums(artistId: string, page: number) {
    const response = await this.spotifyClientService.get<GetArtistAlbumsResponse>(`/artists/${artistId}/albums`, {
      market: 'KR',
      limit: '50',
      offset: ((page - 1) * 50).toString(),
    });
    return {
      ...response,
      total_page: Math.floor((response.total - 1) / 50) + 1,
    };
  }

  async getArtistAllAlbums(artistId: string) {
    const response = await this.getArtistAlbums(artistId, 1);
    if (response.total_page > 1) {
      for (let i = 2; i <= response.total_page; ++i) {
        const additionalItems = await this.getArtistAlbums(artistId, i);
        response.items.push(...additionalItems.items);
      }
    }
    return response;
  }

  async getArtistTopTracks(artistId: string) {
    return await this.spotifyClientService.get<GetArtistTopTracksResponse>(`/artists/${artistId}/top-tracks`, {
      market: 'KR',
    });
  }

  async getArtistRelatedArtist(artistId: string) {
    return await this.spotifyClientService.get<GetArtistRelatedArtistsResponse>(
      `/artists/${artistId}/related-artists`,
      {},
    );
  }
}
