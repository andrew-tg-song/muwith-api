import { Controller, Get, Param } from '@nestjs/common';
import { AlbumService } from './album.service';

@Controller('album')
export class AlbumController {
  constructor(private readonly albumService: AlbumService) {}

  @Get(':id')
  getTrack(@Param('id') id: string) {
    return this.albumService.getAlbum(id);
  }

  // For debug
  @Get()
  getTracks() {
    return this.albumService.getAlbums();
  }
}
