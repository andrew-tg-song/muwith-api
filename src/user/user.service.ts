import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { v4 } from 'uuid';
import { S3Service } from 'src/aws/s3/s3.service';
import * as crypto from 'crypto';
import { ListenableObjectType } from '../constants';
import { Log, LogType } from './entities/log.entity';
import { Track } from '../track/entities/track.entity';
import { Album } from '../album/entities/album.entity';
import { Artist } from '../artist/entities/artist.entity';
import { Playlist } from '../playlist/entities/playlist.entity';
import { TrackService } from '../track/track.service';
import { AlbumService } from '../album/album.service';
import { ArtistService } from '../artist/artist.service';
import { PlaylistService } from '../playlist/playlist.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Log) private readonly logRepository: Repository<Log>,
    private readonly s3Service: S3Service,
    @Inject(forwardRef(() => TrackService))
    private readonly trackService: TrackService,
    @Inject(forwardRef(() => AlbumService))
    private readonly albumService: AlbumService,
    @Inject(forwardRef(() => ArtistService))
    private readonly artistService: ArtistService,
    @Inject(forwardRef(() => PlaylistService))
    private readonly playlistService: PlaylistService,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const loginIdHash = crypto.createHash('sha256').update(dto.loginId).digest('hex');
    const profileImage = dto.profileImage ?? `https://gravatar.com/avatar/${loginIdHash}?d=retro`;
    return await this.userRepository.save({
      ...dto,
      profileImage,
    });
  }

  async findOne(userId: number) {
    return await this.userRepository.findOneBy({ id: userId });
  }

  async findOneByLoginId(loginId: string) {
    return await this.userRepository.findOneBy({ loginId });
  }

  async upsert(user: Partial<User>) {
    return await this.userRepository.save(user);
  }

  async uploadProfileImage(user: User, file: Buffer, fileExt: string) {
    const fileName = v4() + fileExt;
    const response = await this.s3Service.publicUpload(file, fileName);
    user.profileImage = response.objectUrl;
    return await this.upsert(user);
  }

  async getUsers(userIds: number[]) {
    if (userIds.length === 0) {
      return new Map<number, Partial<User>>();
    }
    const users = await this.userRepository.find({
      where: userIds.map((userId) => ({ id: userId })),
    });
    const userMap = new Map<number, Partial<User>>();
    for (const user of users) {
      userMap.set(user.id, {
        id: user.id,
        name: user.name,
        profileImage: user.profileImage,
        followers: user.followers,
        createdAt: user.createdAt,
      });
    }
    return userMap;
  }

  async getUser(userId: number) {
    const userMap = await this.getUsers([userId]);
    return userMap.get(userId);
  }

  private async logToObject(log: Log) {
    if (log.objectType === ListenableObjectType.TRACK) {
      return await this.trackService.getTrack(log.objectId);
    } else if (log.objectType === ListenableObjectType.ALBUM) {
      return await this.albumService.getAlbum(log.objectId);
    } else if (log.objectType === ListenableObjectType.ARTIST) {
      return await this.artistService.getArtist(log.objectId);
    } else if (log.objectType === ListenableObjectType.PLAYLIST) {
      return await this.playlistService.getPlaylist(log.objectId);
    }
  }

  async logPlay(user: User, objectType: ListenableObjectType, objectId: string) {
    return await this.logRepository.save({
      userId: user.id,
      logType: LogType.PLAY,
      objectType,
      objectId,
    });
  }

  async getRandomPlayedObjects(user: User) {
    const logs = await this.logRepository
      .createQueryBuilder()
      .where('userId = :userId AND logType = :logType', { userId: user.id, logType: LogType.PLAY })
      .groupBy('logType, objectId')
      .orderBy('RANDOM()')
      .limit(20)
      .getMany();
    const objects: ((Track | Album | Artist | Playlist) & { objectType: string })[] = [];
    for (const log of logs) {
      objects.push({
        ...(await this.logToObject(log)),
        objectType: log.objectType,
      });
    }
    return objects;
  }

  async logTrackListen(user: User, trackId: string) {
    return await this.logRepository.save({
      userId: user.id,
      logType: LogType.LISTEN,
      objectType: ListenableObjectType.TRACK,
      objectId: trackId,
    });
  }

  async getFrequentListenedTracks(user: User) {
    const logs = await this.logRepository
      .createQueryBuilder()
      .where('userId = :userId AND logType = :logType', { userId: user.id, logType: LogType.LISTEN })
      .groupBy('objectId')
      .orderBy('COUNT(*)', 'DESC')
      .limit(100)
      .getMany();
    const tracks = await this.trackService.getTracks(logs.map((log) => log.objectId));
    return Array.from(tracks.values());
  }

  async getRecentlyListenedTracks(user: User) {
    const logs = await this.logRepository
      .createQueryBuilder()
      .where('userId = :userId AND logType = :logType', { userId: user.id, logType: LogType.LISTEN })
      .groupBy('objectId')
      .orderBy('MAX(createdAt)', 'DESC')
      .limit(100)
      .getMany();
    const tracks = await this.trackService.getTracks(logs.map((log) => log.objectId));
    return Array.from(tracks.values());
  }
}
