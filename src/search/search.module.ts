import { Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { SpotifyModule } from 'src/spotify/spotify.module';
import { TrackModule } from 'src/track/track.module';
import { AlbumModule } from 'src/album/album.module';
import { ArtistModule } from 'src/artist/artist.module';
import { PlaylistModule } from 'src/playlist/playlist.module';

@Module({
  imports: [SpotifyModule, TrackModule, AlbumModule, ArtistModule, PlaylistModule],
  providers: [SearchService],
  controllers: [SearchController],
})
export class SearchModule {}
