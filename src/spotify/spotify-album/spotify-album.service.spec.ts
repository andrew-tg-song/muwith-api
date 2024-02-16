import { Test, TestingModule } from '@nestjs/testing';
import { SpotifyAlbumService } from './spotify-album.service';

describe('SpotifyAlbumService', () => {
  let service: SpotifyAlbumService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SpotifyAlbumService],
    }).compile();

    service = module.get<SpotifyAlbumService>(SpotifyAlbumService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
