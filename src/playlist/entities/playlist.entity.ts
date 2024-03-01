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

  @Column({ nullable: true })
  followers?: number;

  @Column({ nullable: true })
  thumbnailUrl?: string;

  @Column({ nullable: true })
  collectedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
