import { Module } from '@nestjs/common';
import { SpotifyTrackService } from './spotify-track/spotify-track.service';
import { SpotifyClientService } from './spotify-client/spotify-client.service';
import { SpotifyAlbumService } from './spotify-album/spotify-album.service';
import { SpotifyArtistService } from './spotify-artist/spotify-artist.service';
import { SpotifyPlaylistService } from './spotify-playlist/spotify-playlist.service';
import { SpotifyTaskRegister } from './decorator/spotify-task.decorator';
import { DiscoveryModule } from '@nestjs/core';

@Module({
  imports: [DiscoveryModule],
  providers: [
    SpotifyTaskRegister,
    SpotifyTrackService,
    SpotifyClientService,
    SpotifyAlbumService,
    SpotifyArtistService,
    SpotifyPlaylistService,
  ],
  exports: [SpotifyTrackService, SpotifyAlbumService, SpotifyArtistService, SpotifyPlaylistService],
})
export class SpotifyModule {}
