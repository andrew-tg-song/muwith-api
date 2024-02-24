import { Controller, Get, Param } from '@nestjs/common';
import { PlaylistService } from './playlist.service';

@Controller('playlist-set')
export class PlaylistSetController {
  constructor(private readonly playlistService: PlaylistService) {}

  @Get()
  getPlaylistSets() {
    return this.playlistService.getPlaylistSets();
  }

  @Get(':id/playlists')
  getPlaylistSetPlaylists(@Param('id') id: string) {
    return this.playlistService.getPlaylistSetPlaylists(id);
  }
}
