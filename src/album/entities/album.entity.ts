import { Genre } from 'src/genre/entities/genre.entity';
import { Constructable } from 'src/interface/constructable';
import { Track } from 'src/track/entities/track.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('ALBUM')
export class Album extends Constructable<Album> {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column()
  albumType: 'album' | 'single' | 'compilation';

  @Column()
  totalTracks: number;

  @Column({ nullable: true })
  thumbnailUrl?: string;

  @Column()
  releaseDate: string; // YYYY or YYYY-MM or YYYY-MM-DD

  @Column({ nullable: true })
  copyright?: string;

  @Column({ nullable: true })
  recordingCopyright?: string;

  @Column({ nullable: true })
  label?: string;

  @Column({ nullable: true })
  popularity?: number;

  @Column({ nullable: true })
  collectedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Track, (track) => track.album)
  tracks: Track[];

  @ManyToMany(() => Genre, { cascade: true })
  @JoinTable({
    name: 'ALBUM_GENRE',
    joinColumn: { name: 'albumId' },
    inverseJoinColumn: { name: 'genreName' },
  })
  genres: Genre[];
}
