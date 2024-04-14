import * as crypto from 'crypto';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { SpotifyTrackService } from 'src/spotify/spotify-track/spotify-track.service';
import { Track } from './entities/track.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlbumService } from 'src/album/album.service';
import { ArtistService } from 'src/artist/artist.service';
import { YoutubeService } from 'src/youtube/youtube.service';
import { SpotifyTask } from 'src/spotify/decorator/spotify-task.decorator';
import { getHighestResolutionImage } from 'src/spotify/utility/get-highest-resolution-image.utility';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

@Injectable()
export class TrackService {
  private readonly TRACK_RE_COLLECTING_PERIOD = 1000 * 60 * 60 * 24 * 365;
  private readonly RECOMMENDATIONS_CACHE_TTL = 1000 * 60 * 60;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectRepository(Track) private readonly trackRepository: Repository<Track>,
    private readonly spotifyTrackService: SpotifyTrackService,
    private readonly youtubeService: YoutubeService,
    @Inject(forwardRef(() => AlbumService))
    private readonly albumService: AlbumService,
    @Inject(forwardRef(() => ArtistService))
    private readonly artistService: ArtistService,
  ) {}

  async upsert(track: Partial<Track>) {
    return await this.trackRepository.save(track);
  }

  @SpotifyTask()
  private async updateTrackAsSpotifyWithYoutube(trackId: string) {
    const spotifyTrack = await this.spotifyTrackService.getTrack(trackId);

    const album = await this.albumService.upsert({
      id: spotifyTrack.album.id,
      name: spotifyTrack.album.name,
      albumType: spotifyTrack.album.album_type,
      totalTracks: spotifyTrack.album.total_tracks,
      thumbnailUrl: getHighestResolutionImage(spotifyTrack.album.images)?.url,
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

    const youtubeUrl = await this.youtubeService.getFirstVideoUrlBySearch(
      `${spotifyTrack.artists[0].name} ${spotifyTrack.name} audio`,
    );

    return await this.upsert({
      id: spotifyTrack.id,
      name: spotifyTrack.name,
      explicit: spotifyTrack.explicit,
      discNumber: spotifyTrack.disc_number,
      trackNumber: spotifyTrack.track_number,
      duration: spotifyTrack.duration_ms,
      popularity: spotifyTrack.popularity,
      youtubeUrl,
      collectedAt: new Date(),
      album,
      artists,
    });
  }

  @SpotifyTask()
  private async getRecommendationsByTracksAsSpotify(trackIds: string[], limit: number) {
    const spotifyResponse = await this.spotifyTrackService.getRecommendationsByTracks(trackIds, limit);
    const spotifyTracks = spotifyResponse.tracks;

    const tracks: Track[] = [];
    for (const spotifyTrack of spotifyTracks) {
      const foundTrack = await this.trackRepository.findOne({
        where: { id: spotifyTrack.id },
        relations: ['album', 'artists'],
      });
      if (foundTrack && foundTrack.popularity != null) {
        tracks.push(foundTrack);
        continue;
      }

      const album = await this.albumService.upsert({
        id: spotifyTrack.album.id,
        name: spotifyTrack.album.name,
        albumType: spotifyTrack.album.album_type,
        totalTracks: spotifyTrack.album.total_tracks,
        thumbnailUrl: getHighestResolutionImage(spotifyTrack.album.images)?.url,
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

      tracks.push(
        await this.upsert({
          id: spotifyTrack.id,
          name: spotifyTrack.name,
          explicit: spotifyTrack.explicit,
          discNumber: spotifyTrack.disc_number,
          trackNumber: spotifyTrack.track_number,
          duration: spotifyTrack.duration_ms,
          popularity: spotifyTrack.popularity,
          album,
          artists,
        }),
      );
    }

    return tracks;
  }

  async getTracks(trackIds: string[]) {
    const tracks = await this.trackRepository.find({
      where: trackIds.map((trackId) => ({ id: trackId })),
      relations: ['album', 'artists'],
    });
    const trackMap = new Map<string, Track>();
    for (const track of tracks) {
      trackMap.set(track.id, track);
    }
    for (const trackId of trackIds) {
      let track = trackMap.get(trackId);
      if (
        track == null ||
        track.collectedAt == null ||
        Date.now() > track.collectedAt.getTime() + this.TRACK_RE_COLLECTING_PERIOD
      ) {
        track = await this.updateTrackAsSpotifyWithYoutube(trackId);
      }
      trackMap.set(trackId, track);
    }
    return trackMap;
  }

  async getTrack(trackId: string) {
    const trackMap = await this.getTracks([trackId]);
    return trackMap.get(trackId);
  }

  async getRecommendationsByTracks(trackIds: string[], limit: number) {
    const hash = crypto
      .createHash('sha256')
      .update(trackIds.map((v) => `track_${v}`).join(','))
      .digest('hex');
    const cacheKey = `recommendations@${hash}@${limit}`;
    const cachedData: string | null = await this.cacheManager.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    const recommendationsData = await this.getRecommendationsByTracksAsSpotify(trackIds, limit);
    await this.cacheManager.set(cacheKey, JSON.stringify(recommendationsData), this.RECOMMENDATIONS_CACHE_TTL);
    return recommendationsData;
  }
}
