import { Album } from 'src/album/entities/album.entity';
import { Genre } from 'src/genre/entities/genre.entity';
import { Constructable } from 'src/interface/constructable';
import { Track } from 'src/track/entities/track.entity';
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
  collectedAt?: Date;

  @Column({ nullable: true })
  collectedTopTracksAt?: Date;

  @Column({ nullable: true })
  collectedRelatedArtistsAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToMany(() => Track, (track) => track.artists)
  @JoinTable({
    name: 'TRACK_ARTIST',
    joinColumn: { name: 'artistId' },
    inverseJoinColumn: { name: 'trackId' },
  })
  tracks: Track[];

  @ManyToMany(() => Album, (album) => album.artists)
  @JoinTable({
    name: 'ALBUM_ARTIST',
    joinColumn: { name: 'artistId' },
    inverseJoinColumn: { name: 'albumId' },
  })
  albums: Album[];

  @ManyToMany(() => Genre, { cascade: true })
  @JoinTable({
    name: 'ARTIST_GENRE',
    joinColumn: { name: 'artistId' },
    inverseJoinColumn: { name: 'genreName' },
  })
  genres: Genre[];
}
