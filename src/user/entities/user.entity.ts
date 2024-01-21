import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('USER')
export class User {
  @PrimaryGeneratedColumn('increment') // 자동으로 증가되는 옵션 다른 옵션도 있다.
  id: number;

  @Column()
  name: string;
}
