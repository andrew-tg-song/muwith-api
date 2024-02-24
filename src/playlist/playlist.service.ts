import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Playlist } from './entities/playlist.entity';
import { Repository } from 'typeorm';
import { SpotifyPlaylistService } from 'src/spotify/spotify-playlist/spotify-playlist.service';
import { PlaylistTrack } from './entities/playlist-track';
import { Track } from 'src/track/entities/track.entity';
import { TrackService } from 'src/track/track.service';
import { ArtistService } from 'src/artist/artist.service';
import { AlbumService } from 'src/album/album.service';

@Injectable()
export class PlaylistService {
  private readonly PLAYLIST_RE_COLLECTING_PERIOD = 1000 * 60 * 60 * 24 * 1;

  constructor(
    @InjectRepository(Playlist) private readonly playlistRepository: Repository<Playlist>,
    @InjectRepository(PlaylistTrack) private readonly playlistTrackRepository: Repository<PlaylistTrack>,
    private readonly spotifyPlaylistService: SpotifyPlaylistService,
    private readonly trackService: TrackService,
    private readonly albumService: AlbumService,
    private readonly artistService: ArtistService,
  ) {}

  async upsert(playlist: Partial<Playlist>) {
    return await this.playlistRepository.save(playlist);
  }

  private async updatePlaylistAsSpotify(playlistId: string) {
    const spotifyPlaylist = await this.spotifyPlaylistService.getPlaylist(playlistId);

    const playlist = await this.upsert({
      id: spotifyPlaylist.id,
      name: spotifyPlaylist.name,
      description: spotifyPlaylist.description,
      followers: spotifyPlaylist.followers.total,
      thumbnailUrl: spotifyPlaylist.images[0]?.url,
      collectedAt: new Date(),
    });

    const tracks: Track[] = [];
    for (const spotifyTrack of spotifyPlaylist.tracks.items) {
      const track = spotifyTrack.track;
      console.info(spotifyTrack);
      if (track.episode) {
        continue;
      }
      const albumArtists = await Promise.all(
        track.album.artists.map(async (artist) => {
          return await this.artistService.upsert({
            id: artist.id,
            name: artist.name,
          });
        }),
      );
      const album = await this.albumService.upsert({
        id: track.album.id,
        name: track.album.name,
        albumType: track.album.album_type,
        totalTracks: track.album.total_tracks,
        thumbnailUrl: track.album.images[0]?.url,
        releaseDate: track.album.release_date,
        artists: albumArtists,
      });
      const artists = await Promise.all(
        track.artists.map(async (artist) => {
          return await this.artistService.upsert({
            id: artist.id,
            name: artist.name,
          });
        }),
      );
      tracks.push(
        await this.trackService.upsert({
          id: track.id,
          name: track.name,
          explicit: track.explicit,
          discNumber: track.disc_number,
          trackNumber: track.track_number,
          duration: track.duration_ms,
          album,
          artists,
        }),
      );
    }

    await Promise.all(
      tracks.map(async (track, i) => {
        const playlistTrack = new PlaylistTrack({
          playlist,
          track,
          order: i + 1,
        });
        return await this.playlistTrackRepository.save(playlistTrack);
      }),
    );

    return playlist;
  }

  async getPlaylist(playlistId: string) {
    let playlist = await this.playlistRepository.findOne({ where: { id: playlistId } });
    if (
      playlist == null ||
      playlist.collectedAt == null ||
      Date.now() > playlist.collectedAt.getTime() + this.PLAYLIST_RE_COLLECTING_PERIOD
    ) {
      playlist = await this.updatePlaylistAsSpotify(playlistId);
    }
    const playlistTracks = await this.playlistTrackRepository.find({
      where: { playlist: { id: playlist.id } },
      relations: ['track'],
      order: { order: 'asc' },
    });
    return {
      ...(playlist as Required<Playlist>),
      tracks: playlistTracks.map((playlistTrack) => playlistTrack.track),
    };
  }
}
