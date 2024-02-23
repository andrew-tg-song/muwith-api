import { Injectable } from '@nestjs/common';
import { SpotifyClientService } from '../spotify-client/spotify-client.service';
import { GetAlbumResponse } from './interface/get-album-response';
import { GetAlbumTracksResponse } from './interface/get-album-tracks-response';

@Injectable()
export class SpotifyAlbumService {
  constructor(private readonly spotifyClientService: SpotifyClientService) {}

  async getAlbum(albumId: string) {
    return await this.spotifyClientService.get<GetAlbumResponse>(`/albums/${albumId}`, { market: 'KR' });
  }

  async getAlbumTracks(albumId: string, page: number) {
    const response = await this.spotifyClientService.get<GetAlbumTracksResponse>(`/albums/${albumId}/tracks`, {
      market: 'KR',
      limit: '50',
      offset: ((page - 1) * 50).toString(),
    });
    return {
      ...response,
      total_page: Math.floor((response.total - 1) / 50) + 1,
    };
  }

  async getAlbumAllTracks(albumId: string) {
    const response = await this.getAlbumTracks(albumId, 1);
    if (response.total_page > 1) {
      for (let i = 2; i <= response.total_page; ++i) {
        const additionalItems = await this.getAlbumTracks(albumId, i);
        response.items.push(...additionalItems.items);
      }
    }
    return response;
  }
}
