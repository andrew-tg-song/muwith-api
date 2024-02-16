import { Constructable } from 'src/interface/constructable';
import { Entity, PrimaryColumn } from 'typeorm';

@Entity('GENRE')
export class Genre extends Constructable<Genre> {
  @PrimaryColumn()
  name: string;
}
