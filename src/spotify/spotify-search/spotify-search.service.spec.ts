import { Test, TestingModule } from '@nestjs/testing';
import { SpotifySearchService } from './spotify-search.service';

describe('SpotifySearchService', () => {
  let service: SpotifySearchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SpotifySearchService],
    }).compile();

    service = module.get<SpotifySearchService>(SpotifySearchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
