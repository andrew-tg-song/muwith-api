import { Constructable } from 'src/interface/constructable';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Artist } from './artist.entity';
import { Track } from 'src/track/entities/track.entity';

@Entity('ARTIST_TOP_TRACK')
export class ArtistTopTrack extends Constructable<ArtistTopTrack> {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Artist)
  artist: Artist;

  @ManyToOne(() => Track)
  track: Track;

  @Column()
  rank: number;
}
