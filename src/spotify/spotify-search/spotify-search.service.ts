import { Injectable } from '@nestjs/common';
import { SpotifyClientService } from '../spotify-client/spotify-client.service';
import { SearchResponse } from './interface/search-response';
import { ObjectType } from '../../constants';

export const SEARCH_OBJECT_TYPES = [
  ObjectType.TRACK,
  ObjectType.ALBUM,
  ObjectType.ARTIST,
  ObjectType.PLAYLIST,
] as const;
export type SearchObjectType = (typeof SEARCH_OBJECT_TYPES)[number];

@Injectable()
export class SpotifySearchService {
  constructor(private readonly spotifyClientService: SpotifyClientService) {}

  async search(keyword: string, types: SearchObjectType[], page: number) {
    const response = await this.spotifyClientService.get<SearchResponse>(
      '/search?' +
        `q=${encodeURIComponent(keyword)}` +
        `&type=${types.join('%2C')}` +
        '&market=KR' +
        '&limit=50' +
        `&offset=${((page - 1) * 50).toString()}`,
      {},
    );
    SEARCH_OBJECT_TYPES.forEach((objectType) => {
      const objectTypePlural = objectType + 's';
      if (response[objectTypePlural]) {
        response[objectTypePlural].total_page = Math.floor((response[objectTypePlural].total - 1) / 50) + 1;
      }
    });
    return response;
  }
}
