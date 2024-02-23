import { Module } from '@nestjs/common';
import { SpotifyTrackService } from './spotify-track/spotify-track.service';
import { SpotifyClientService } from './spotify-client/spotify-client.service';
import { SpotifyAlbumService } from './spotify-album/spotify-album.service';
import { SpotifyArtistService } from './spotify-artist/spotify-artist.service';

@Module({
  providers: [SpotifyTrackService, SpotifyClientService, SpotifyAlbumService, SpotifyArtistService],
  exports: [SpotifyTrackService, SpotifyAlbumService, SpotifyArtistService],
})
export class SpotifyModule {}
