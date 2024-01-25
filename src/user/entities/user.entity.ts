import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('USER')
export class User {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  loginId: string;

  @Column()
  name: string;
}
