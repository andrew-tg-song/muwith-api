import { Module } from '@nestjs/common';
import { PlaylistService } from './playlist.service';
import { PlaylistController } from './playlist.controller';
import { SpotifyModule } from 'src/spotify/spotify.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Playlist } from './entities/playlist.entity';
import { PlaylistTrack } from './entities/playlist-track';
import { TrackModule } from 'src/track/track.module';
import { ArtistModule } from 'src/artist/artist.module';
import { AlbumModule } from 'src/album/album.module';

@Module({
  imports: [TypeOrmModule.forFeature([Playlist, PlaylistTrack]), SpotifyModule, TrackModule, AlbumModule, ArtistModule],
  providers: [PlaylistService],
  controllers: [PlaylistController],
})
export class PlaylistModule {}
