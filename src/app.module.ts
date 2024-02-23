import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IS_PRODUCTION_MODE } from './constants';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { AwsModule } from './aws/aws.module';
import { SpotifyModule } from './spotify/spotify.module';
import { TrackModule } from './track/track.module';
import { AlbumModule } from './album/album.module';
import { ArtistModule } from './artist/artist.module';
import { GenreModule } from './genre/genre.module';
import { YoutubeModule } from './youtube/youtube.module';

@Module({
  imports: [
    // https://typeorm.io/data-source-options#common-data-source-options
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'muwith.db',
      autoLoadEntities: true,
      synchronize: !IS_PRODUCTION_MODE,
      logging: !IS_PRODUCTION_MODE,
      dropSchema: false,
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    UserModule,
    AuthModule,
    AwsModule,
    SpotifyModule,
    TrackModule,
    AlbumModule,
    ArtistModule,
    GenreModule,
    YoutubeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
