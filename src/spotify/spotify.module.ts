import { Module } from '@nestjs/common';
import { SpotifyTrackService } from './spotify-track/spotify-track.service';
import { SpotifyClientService } from './spotify-client/spotify-client.service';

@Module({
  providers: [SpotifyTrackService, SpotifyClientService],
  exports: [SpotifyTrackService],
})
export class SpotifyModule {}
