import { Album } from 'src/album/entities/album.entity';
import { Artist } from 'src/artist/entities/artist.entity';
import { Constructable } from 'src/interface/constructable';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('TRACK')
export class Track extends Constructable<Track> {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column()
  explicit: boolean;

  @Column()
  discNumber: number;

  @Column()
  trackNumber: number;

  @Column()
  duration: number; // in milliseconds

  @Column({ nullable: true })
  popularity?: number;

  @Column()
  youtubeUrl?: string;

  @Column({ nullable: true })
  collectedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Album, (album) => album.tracks)
  album: Album;

  @ManyToMany(() => Artist, (artist) => artist.tracks, { cascade: true })
  @JoinTable({
    name: 'TRACK_ARTIST',
    joinColumn: { name: 'trackId' },
    inverseJoinColumn: { name: 'artistId' },
  })
  artists: Artist[];
}
