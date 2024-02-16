import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Artist } from './entities/artist.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class ArtistService {
  constructor(@InjectRepository(Artist) private readonly artistRepository: Repository<Artist>) {}

  async upsert(artist: Partial<Artist>) {
    return await this.artistRepository.save(artist);
  }
}
