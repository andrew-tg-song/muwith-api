import { Injectable } from '@nestjs/common';
import { GetUserResponse } from './interface/get-user-response';
import { SpotifyClientService } from '../spotify-client/spotify-client.service';

@Injectable()
export class SpotifyUserService {
  constructor(private readonly spotifyClientService: SpotifyClientService) {}

  async getUser(userId: string) {
    return await this.spotifyClientService.get<GetUserResponse>(`/users/${userId}`, {});
  }
}
