import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import { TrackService } from './track.service';

interface GetRecommendationsByTracksQuery {
  trackIds: string;
  limit?: string;
}

@Controller('track')
export class TrackController {
  constructor(private readonly trackService: TrackService) {}

  @Get('/recommendations-by-tracks')
  async getRecommendationsByTracks(@Query() query: GetRecommendationsByTracksQuery) {
    if (typeof query.trackIds !== 'string') {
      throw new BadRequestException('All required query parameters must be entered.');
    }
    const trackIds = query.trackIds.split(',');
    if (trackIds.length > 5) {
      throw new BadRequestException('track count must be 5 or less.');
    }
    const limit = Number(query.limit ?? '10');
    if (isNaN(limit) || !Number.isInteger(limit) || limit < 1) {
      throw new BadRequestException('limit value must be natural number.');
    }
    if (limit > 100) {
      throw new BadRequestException('limit value must be 100 or less.');
    }
    return this.trackService.getRecommendationsByTracks(trackIds, limit);
  }

  @Get(':id')
  getTrack(@Param('id') id: string) {
    return this.trackService.getTrack(id);
  }
}
