import { Constructable } from 'src/interface/constructable';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum LogType {
  PLAY = 'play',
  LISTEN = 'listen',
}

@Entity('LOG')
export class Log extends Constructable<Log> {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  userId: number;

  @Column()
  logType: string;

  @Column()
  objectType: string;

  @Column()
  objectId: string;

  @CreateDateColumn()
  createdAt: Date;
}
