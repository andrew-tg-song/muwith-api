import { Module, forwardRef } from '@nestjs/common';
import { ArtistController } from './artist.controller';
import { ArtistService } from './artist.service';
import { Artist } from './entities/artist.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArtistTopTrack } from './entities/artist-top-track.entity';
import { ArtistRelatedArtist } from './entities/artist-related-artist.entity';
import { SpotifyModule } from 'src/spotify/spotify.module';
import { TrackModule } from 'src/track/track.module';
import { AlbumModule } from 'src/album/album.module';
import { Album } from 'src/album/entities/album.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Album, Artist, ArtistTopTrack, ArtistRelatedArtist]),
    SpotifyModule,
    forwardRef(() => TrackModule),
    forwardRef(() => AlbumModule),
  ],
  controllers: [ArtistController],
  providers: [ArtistService],
  exports: [ArtistService],
})
export class ArtistModule {}
