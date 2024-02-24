import { Injectable } from '@nestjs/common';
import { SpotifyClientService } from '../spotify-client/spotify-client.service';
import { GetPlaylistResponse } from './interface/get-playlist-response';

@Injectable()
export class SpotifyPlaylistService {
  constructor(private readonly spotifyClientService: SpotifyClientService) {}

  async getPlaylist(playlistId: string) {
    return await this.spotifyClientService.get<GetPlaylistResponse>(`/playlists/${playlistId}`, { market: 'KR' });
  }
}
