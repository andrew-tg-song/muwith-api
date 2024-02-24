import { Controller, Get, Param } from '@nestjs/common';
import { PlaylistService } from './playlist.service';

@Controller('playlist')
export class PlaylistController {
  constructor(private readonly playlistService: PlaylistService) {}

  @Get(':id')
  getPlaylist(@Param('id') id: string) {
    return this.playlistService.getPlaylist(id);
  }
}
