import { Constructable } from 'src/interface/constructable';
import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('PLAYLSIT_SET')
export class PlaylistSet extends Constructable<PlaylistSet> {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column()
  thumbnailUrl?: string;

  @Column()
  order: number;

  @Column()
  collectedAt: Date;

  @Column({ nullable: true })
  collectedPlaylistsAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
