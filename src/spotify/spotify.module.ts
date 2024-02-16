import { Module } from '@nestjs/common';
import { SpotifyTrackService } from './spotify-track/spotify-track.service';
import { SpotifyClientService } from './spotify-client/spotify-client.service';
import { SpotifyAlbumService } from './spotify-album/spotify-album.service';

@Module({
  providers: [SpotifyTrackService, SpotifyClientService, SpotifyAlbumService],
  exports: [SpotifyTrackService, SpotifyAlbumService],
})
export class SpotifyModule {}
