import { Test, TestingModule } from '@nestjs/testing';
import { SpotifyTrackService } from './spotify-track.service';

describe('SpotifyTrackService', () => {
  let service: SpotifyTrackService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SpotifyTrackService],
    }).compile();

    service = module.get<SpotifyTrackService>(SpotifyTrackService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
