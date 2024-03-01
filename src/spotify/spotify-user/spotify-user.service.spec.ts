import { Test, TestingModule } from '@nestjs/testing';
import { SpotifyUserService } from './spotify-user.service';

describe('SpotifyUserService', () => {
  let service: SpotifyUserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SpotifyUserService],
    }).compile();

    service = module.get<SpotifyUserService>(SpotifyUserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
