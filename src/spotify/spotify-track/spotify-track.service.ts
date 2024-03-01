import { Injectable } from '@nestjs/common';
import { SpotifyClientService } from '../spotify-client/spotify-client.service';
import { GetTrackResponse } from './interface/get-track-response';
import { GetRecommendationsResponse } from './interface/get-recommendations-response';

@Injectable()
export class SpotifyTrackService {
  constructor(private readonly spotifyClientService: SpotifyClientService) {}

  async getTrack(trackId: string) {
    return await this.spotifyClientService.get<GetTrackResponse>(`/tracks/${trackId}`, { market: 'KR' });
  }

  async getRecommendationsByTracks(trackIds: string[], limit: number) {
    const response = await this.spotifyClientService.get<GetRecommendationsResponse>(`/recommendations`, {
      market: 'KR',
      limit: limit.toString(),
      seed_tracks: trackIds.join(','),
    });
    // There is a problem with album_type being returned in uppercase letters.
    response.tracks.forEach((track) => {
      track.album.album_type = track.album.album_type.toLowerCase() as 'album' | 'single' | 'compilation';
    });
    return response;
  }
}
