import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Album } from './entities/album.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AlbumService {
  constructor(@InjectRepository(Album) private readonly albumRepository: Repository<Album>) {}

  async upsert(album: Partial<Album>) {
    return await this.albumRepository.save(album);
  }
}
