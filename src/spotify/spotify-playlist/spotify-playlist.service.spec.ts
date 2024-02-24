import { Test, TestingModule } from '@nestjs/testing';
import { SpotifyPlaylistService } from './spotify-playlist.service';

describe('SpotifyPlaylistService', () => {
  let service: SpotifyPlaylistService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SpotifyPlaylistService],
    }).compile();

    service = module.get<SpotifyPlaylistService>(SpotifyPlaylistService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
