import { Controller, Get, Param } from '@nestjs/common';
import { ArtistService } from './artist.service';

@Controller('artist')
export class ArtistController {
  constructor(private readonly artistService: ArtistService) {}

  @Get(':id')
  getArtist(@Param('id') id: string) {
    return this.artistService.getArtist(id);
  }

  @Get(':id/top-tracks')
  getArtistTopTracks(@Param('id') id: string) {
    return this.artistService.getArtistTopTracks(id);
  }

  @Get(':id/related-artists')
  getArtistRelatedArtists(@Param('id') id: string) {
    return this.artistService.getArtistRelatedArtists(id);
  }
}
