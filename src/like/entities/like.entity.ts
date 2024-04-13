import { Constructable } from 'src/interface/constructable';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('LIKE')
export class Like extends Constructable<Like> {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  userId: number;

  @Column()
  objectType: string;

  @Column()
  objectId: string;

  @CreateDateColumn()
  createdAt: Date;
}
