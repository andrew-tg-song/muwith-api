import { Constructable } from 'src/interface/constructable';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Track } from 'src/track/entities/track.entity';
import { Playlist } from './playlist.entity';

@Entity('PLAYLSIT_TRACK')
export class PlaylistTrack extends Constructable<PlaylistTrack> {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Playlist)
  playlist: Playlist;

  @ManyToOne(() => Track)
  track: Track;

  @Column()
  order: number;
}
