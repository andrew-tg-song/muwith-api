import { Constructable } from 'src/interface/constructable';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Artist } from './artist.entity';

@Entity('ARTIST_RELATED_ARTIST')
export class ArtistRelatedArtist extends Constructable<ArtistRelatedArtist> {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Artist)
  departureArtist: Artist;

  @ManyToOne(() => Artist)
  arrivalArtist: Artist;

  @Column()
  rank: number;
}
