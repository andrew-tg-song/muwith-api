import { Constructable } from 'src/interface/constructable';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('USER')
export class User extends Constructable<User> {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  loginId: string;

  @Column()
  name: string;

  @Column()
  profileImage: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
