import { Test, TestingModule } from '@nestjs/testing';
import { SpotifyClientService } from './spotify-client.service';

describe('SpotifyClientService', () => {
  let service: SpotifyClientService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SpotifyClientService],
    }).compile();

    service = module.get<SpotifyClientService>(SpotifyClientService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
