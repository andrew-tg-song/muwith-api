import { Constructable } from 'src/interface/constructable';
import { User } from 'src/user/entities/user.entity';
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';

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

  @ManyToOne(() => User, { nullable: true })
  owner?: User;

  @Column({ nullable: true })
  collectedAt?: Date;

  @Column({ default: false })
  notCollect: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
