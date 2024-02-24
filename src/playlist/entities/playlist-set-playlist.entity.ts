import { Constructable } from 'src/interface/constructable';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Playlist } from './playlist.entity';
import { PlaylistSet } from './playlist-set.entity';

@Entity('PLAYLSIT_SET_PLAYLIST')
export class PlaylistSetPlaylist extends Constructable<PlaylistSetPlaylist> {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PlaylistSet)
  playlistSet: PlaylistSet;

  @ManyToOne(() => Playlist)
  playlist: Playlist;

  @Column()
  order: number;
}
