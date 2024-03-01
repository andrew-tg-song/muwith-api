import { Module } from '@nestjs/common';
import { SpotifyTrackService } from './spotify-track/spotify-track.service';
import { SpotifyClientService } from './spotify-client/spotify-client.service';
import { SpotifyAlbumService } from './spotify-album/spotify-album.service';
import { SpotifyArtistService } from './spotify-artist/spotify-artist.service';
import { SpotifyPlaylistService } from './spotify-playlist/spotify-playlist.service';
import { SpotifyTaskRegister } from './decorator/spotify-task.decorator';
import { DiscoveryModule } from '@nestjs/core';
import { SpotifySearchService } from './spotify-search/spotify-search.service';
import { SpotifyUserService } from './spotify-user/spotify-user.service';

@Module({
  imports: [DiscoveryModule],
  providers: [
    SpotifyTaskRegister,
    SpotifyTrackService,
    SpotifyClientService,
    SpotifyAlbumService,
    SpotifyArtistService,
    SpotifyPlaylistService,
    SpotifySearchService,
    SpotifyUserService,
  ],
  exports: [
    SpotifyTrackService,
    SpotifyAlbumService,
    SpotifyArtistService,
    SpotifyPlaylistService,
    SpotifySearchService,
    SpotifyUserService,
  ],
})
export class SpotifyModule {}
