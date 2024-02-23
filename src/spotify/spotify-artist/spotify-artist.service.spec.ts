import { Test, TestingModule } from '@nestjs/testing';
import { SpotifyArtistService } from './spotify-artist.service';

describe('SpotifyArtistService', () => {
  let service: SpotifyArtistService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SpotifyArtistService],
    }).compile();

    service = module.get<SpotifyArtistService>(SpotifyArtistService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
