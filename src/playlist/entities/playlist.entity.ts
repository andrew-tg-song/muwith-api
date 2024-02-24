import { Constructable } from 'src/interface/constructable';
import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('PLAYLIST')
export class Playlist extends Constructable<Playlist> {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  followers: number;

  @Column()
  thumbnailUrl: string;

  @Column({ nullable: true })
  collectedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
