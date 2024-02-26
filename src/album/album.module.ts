import { Module, forwardRef } from '@nestjs/common';
import { AlbumController } from './album.controller';
import { AlbumService } from './album.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Album } from './entities/album.entity';
import { SpotifyModule } from 'src/spotify/spotify.module';
import { TrackModule } from 'src/track/track.module';
import { ArtistModule } from 'src/artist/artist.module';
import { ArtistAlbum } from '../artist/entities/artist-album.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Album, ArtistAlbum]),
    SpotifyModule,
    forwardRef(() => TrackModule),
    forwardRef(() => ArtistModule),
  ],
  controllers: [AlbumController],
  providers: [AlbumService],
  exports: [AlbumService],
})
export class AlbumModule {}
