import { Injectable } from '@nestjs/common';
import { SpotifyClientService } from '../spotify-client/spotify-client.service';
import { GetPlaylistResponse } from './interface/get-playlist-response';
import { GetPlaylistSetsResponse } from './interface/get-playlist-sets-response';
import { GetPlaylistSetPlaylistsResponse } from './interface/get-playlist-set-playlists-response';

@Injectable()
export class SpotifyPlaylistService {
  constructor(private readonly spotifyClientService: SpotifyClientService) {}

  async getPlaylist(playlistId: string) {
    return await this.spotifyClientService.get<GetPlaylistResponse>(`/playlists/${playlistId}`, { market: 'KR' });
  }

  async getPlaylistSets(page: number) {
    const response = await this.spotifyClientService.get<GetPlaylistSetsResponse>('/browse/categories', {
      locale: 'ko_KR',
      limit: '50',
      offset: ((page - 1) * 50).toString(),
    });
    return {
      ...response,
      total_page: Math.floor((response.categories.total - 1) / 50) + 1,
    };
  }

  async getAllPlaylistSets() {
    const response = await this.getPlaylistSets(1);
    if (response.total_page > 1) {
      for (let i = 2; i <= response.total_page; ++i) {
        const additionalItems = await this.getPlaylistSets(i);
        response.categories.items.push(...additionalItems.categories.items);
      }
    }
    return response;
  }

  async getPlaylistSetPlaylists(playlistSetId: string, page: number) {
    const response = await this.spotifyClientService.get<GetPlaylistSetPlaylistsResponse>(
      `/browse/categories/${playlistSetId}/playlists`,
      {
        limit: '50',
        offset: ((page - 1) * 50).toString(),
      },
    );
    return {
      ...response,
      total_page: Math.floor((response.playlists.total - 1) / 50) + 1,
    };
  }

  async getAllPlaylistSetPlaylists(playlistSetId: string) {
    const response = await this.getPlaylistSetPlaylists(playlistSetId, 1);
    if (response.total_page > 1) {
      for (let i = 2; i <= response.total_page; ++i) {
        const additionalItems = await this.getPlaylistSetPlaylists(playlistSetId, i);
        response.playlists.items.push(...additionalItems.playlists.items);
      }
    }
    return response;
  }
}
