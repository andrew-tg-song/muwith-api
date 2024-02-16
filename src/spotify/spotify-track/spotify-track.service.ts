import { Injectable } from '@nestjs/common';
import { SpotifyClientService } from '../spotify-client/spotify-client.service';
import { GetTrackResponse } from './interface/get-track-response';

@Injectable()
export class SpotifyTrackService {
  constructor(private readonly spotifyClientService: SpotifyClientService) {}

  async getTrack(trackId: string) {
    return await this.spotifyClientService.get<GetTrackResponse>(`/tracks/${trackId}`, { market: 'KR' });
  }
}
