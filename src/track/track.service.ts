import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { SpotifyTrackService } from 'src/spotify/spotify-track/spotify-track.service';
import { Track } from './entities/track.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlbumService } from 'src/album/album.service';
import { ArtistService } from 'src/artist/artist.service';

@Injectable()
export class TrackService {
  private readonly TRACK_RE_COLLECTING_PERIOD = 1000 * 60 * 60 * 24 * 7;

  constructor(
    @InjectRepository(Track) private readonly trackRepository: Repository<Track>,
    private readonly spotifyTrackService: SpotifyTrackService,
    @Inject(forwardRef(() => AlbumService))
    private readonly albumService: AlbumService,
    private readonly artistService: ArtistService,
  ) {}

  async upsert(track: Partial<Track>) {
    // TODO: Do not use save method.
    return await this.trackRepository.save(track);
  }

  async updateTrackAsSpotify(trackId: string) {
    const spotifyTrack = await this.spotifyTrackService.getTrack(trackId);

    const album = await this.albumService.upsert({
      id: spotifyTrack.album.id,
      name: spotifyTrack.album.name,
      albumType: spotifyTrack.album.album_type,
      totalTracks: spotifyTrack.album.total_tracks,
      thumbnailUrl: spotifyTrack.album.images[0]?.url,
      releaseDate: spotifyTrack.album.release_date,
    });

    const artists = await Promise.all(
      spotifyTrack.artists.map(async (artist) => {
        return await this.artistService.upsert({
          id: artist.id,
          name: artist.name,
        });
      }),
    );

    return await this.upsert({
      id: spotifyTrack.id,
      name: spotifyTrack.name,
      explicit: spotifyTrack.explicit,
      discNumber: spotifyTrack.disc_number,
      trackNumber: spotifyTrack.track_number,
      duration: spotifyTrack.duration_ms,
      popularity: spotifyTrack.popularity,
      collectedAt: new Date(),
      album,
      artists,
    });
  }

  async getTrack(trackId: string) {
    let track = await this.trackRepository.findOne({
      where: { id: trackId },
      relations: ['album', 'artists'],
    });
    if (track == null || Date.now() > track.collectedAt.getTime() + this.TRACK_RE_COLLECTING_PERIOD) {
      track = await this.updateTrackAsSpotify(trackId);
    }
    return track as Required<Track>;
  }

  // For debug
  async getTracks() {
    return await this.trackRepository.find();
  }
}