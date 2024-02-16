import { Injectable } from '@nestjs/common';
import { SpotifyClientService } from '../spotify-client/spotify-client.service';
import { GetAlbumResponse } from './interface/get-album-response';

@Injectable()
export class SpotifyAlbumService {
  constructor(private readonly spotifyClientService: SpotifyClientService) {}

  async getAlbum(albumId: string) {
    return await this.spotifyClientService.get<GetAlbumResponse>(`/albums/${albumId}`, { market: 'KR' });
  }
}
