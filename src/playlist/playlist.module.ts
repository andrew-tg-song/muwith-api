import { Module } from '@nestjs/common';
import { PlaylistService } from './playlist.service';
import { PlaylistController } from './playlist.controller';
import { SpotifyModule } from 'src/spotify/spotify.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Playlist } from './entities/playlist.entity';
import { PlaylistTrack } from './entities/playlist-track.entity';
import { TrackModule } from 'src/track/track.module';
import { ArtistModule } from 'src/artist/artist.module';
import { AlbumModule } from 'src/album/album.module';
import { PlaylistSet } from './entities/playlist-set.entity';
import { PlaylistSetPlaylist } from './entities/playlist-set-playlist.entity';
import { PlaylistSetController } from './playlist-set.controller';
import { ArtistAlbum } from '../artist/entities/artist-album.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ArtistAlbum, Playlist, PlaylistTrack, PlaylistSet, PlaylistSetPlaylist]),
    SpotifyModule,
    TrackModule,
    AlbumModule,
    ArtistModule,
  ],
  providers: [PlaylistService],
  controllers: [PlaylistController, PlaylistSetController],
  exports: [PlaylistService],
})
export class PlaylistModule {}
