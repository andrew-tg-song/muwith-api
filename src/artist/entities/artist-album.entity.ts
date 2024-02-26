import { Constructable } from 'src/interface/constructable';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Artist } from './artist.entity';
import { Album } from '../../album/entities/album.entity';

@Entity('ARTIST_ALBUM')
export class ArtistAlbum extends Constructable<ArtistAlbum> {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Artist)
  artist: Artist;

  @ManyToOne(() => Album)
  album: Album;

  @Column()
  albumGroup: 'direct' | 'indirect';
}
