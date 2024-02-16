import { Controller, Get, Param } from '@nestjs/common';
import { TrackService } from './track.service';

@Controller('track')
export class TrackController {
  constructor(private readonly trackService: TrackService) {}

  @Get(':id')
  getTrack(@Param('id') id: string) {
    return this.trackService.getTrack(id);
  }

  // For debug
  @Get()
  getTracks() {
    return this.trackService.getTracks();
  }
}
