import { Controller, Get, Param, Query } from '@nestjs/common';
import { ArtistService } from './artist.service';
import { ARTIST_ALBUM_GROUP_KIND, ArtistAlbumGroup } from '../spotify/spotify-artist/spotify-artist.service';

@Controller('artist')
export class ArtistController {
  constructor(private readonly artistService: ArtistService) {}

  @Get(':id')
  getArtist(@Param('id') id: string, @Query() query) {
    let albumGroup = query.albumGroup as ArtistAlbumGroup | undefined;
    if (!ARTIST_ALBUM_GROUP_KIND.includes(albumGroup)) {
      albumGroup = undefined;
    }
    return this.artistService.getArtist(id, albumGroup);
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
