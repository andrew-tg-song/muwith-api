import { Genre } from 'src/genre/entities/genre.entity';
import { Constructable } from 'src/interface/constructable';
import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('ARTIST')
export class Artist extends Constructable<Artist> {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  thumbnailUrl?: string;

  @Column({ nullable: true })
  followers?: number;

  @Column({ nullable: true })
  popularity?: number;

  @Column({ nullable: true })
  collectedDirectAlbumsAt?: Date;

  @Column({ nullable: true })
  collectedIndirectAlbumsAt?: Date;

  @Column({ nullable: true })
  collectedTopTracksAt?: Date;

  @Column({ nullable: true })
  collectedRelatedArtistsAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToMany(() => Genre, { cascade: true })
  @JoinTable({
    name: 'ARTIST_GENRE',
    joinColumn: { name: 'artistId' },
    inverseJoinColumn: { name: 'genreName' },
  })
  genres: Genre[];
}
