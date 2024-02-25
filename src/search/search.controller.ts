import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { SEARCH_OBJECT_TYPES, SearchObjectType } from 'src/spotify/spotify-search/spotify-search.service';

interface SearchQuery {
  keyword: string;
  types: string;
  page: string;
}

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  search(@Query() query: SearchQuery) {
    if (typeof query.keyword !== 'string' || typeof query.types !== 'string') {
      throw new BadRequestException('All required query parameters must be entered.');
    }
    const page = Number(query.page ?? '1');
    if (isNaN(page) || !Number.isInteger(page) || page < 1) {
      throw new BadRequestException('page value must be natural number.');
    }
    const types = query.types.split(',') as SearchObjectType[];
    if (types.find((v) => !SEARCH_OBJECT_TYPES.includes(v)) != null) {
      throw new BadRequestException(
        `You must be enter valid types. (Support types: ${SEARCH_OBJECT_TYPES.join(', ')})`,
      );
    }
    types.sort();
    return this.searchService.search(query.keyword, types, page);
  }
}
