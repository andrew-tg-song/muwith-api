import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { AwsModule } from 'src/aws/aws.module';
import { LikeModule } from '../like/like.module';
import { Log } from './entities/log.entity';
import { TrackModule } from '../track/track.module';
import { AlbumModule } from '../album/album.module';
import { ArtistModule } from '../artist/artist.module';
import { PlaylistModule } from '../playlist/playlist.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Log]),
    AwsModule,
    forwardRef(() => LikeModule),
    forwardRef(() => TrackModule),
    forwardRef(() => AlbumModule),
    forwardRef(() => ArtistModule),
    forwardRef(() => PlaylistModule),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
