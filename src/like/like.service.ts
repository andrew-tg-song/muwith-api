import { ConflictException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like } from './entities/like.entity';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { ObjectType } from '../constants';
import { TrackService } from '../track/track.service';
import { AlbumService } from '../album/album.service';
import { ArtistService } from '../artist/artist.service';
import { PlaylistService } from '../playlist/playlist.service';
import { UserService } from '../user/user.service';

@Injectable()
export class LikeService {
  constructor(
    @InjectRepository(Like) private readonly likeRepository: Repository<Like>,
    @Inject(forwardRef(() => TrackService))
    private readonly trackService: TrackService,
    @Inject(forwardRef(() => AlbumService))
    private readonly albumService: AlbumService,
    @Inject(forwardRef(() => ArtistService))
    private readonly artistService: ArtistService,
    @Inject(forwardRef(() => PlaylistService))
    private readonly playlistService: PlaylistService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {}

  async like(user: User, objectType: ObjectType, objectId: string) {
    const exists = await this.likeRepository.findOne({
      where: {
        userId: user.id,
        objectType,
        objectId,
      },
    });
    if (exists != null) {
      throw new ConflictException();
    }

    if (objectType === ObjectType.ARTIST) {
      const artist = await this.artistService.getArtist(objectId);
      artist.followers += 1;
      await this.artistService.upsert(artist);
    } else if (objectType === ObjectType.PLAYLIST) {
      const playlist = await this.playlistService.getPlaylist(objectId);
      playlist.followers += 1;
      await this.playlistService.upsert(playlist);
    } else if (objectType === ObjectType.USER) {
      const user = await this.userService.getUser(Number(objectId));
      user.followers += 1;
      await this.userService.upsert(user);
    }

    return await this.likeRepository.save({
      userId: user.id,
      objectType,
      objectId,
    });
  }

  async unlike(user: User, objectType: ObjectType, objectId: string) {
    const exists = await this.likeRepository.findOne({
      where: {
        userId: user.id,
        objectType,
        objectId,
      },
    });
    if (exists == null) {
      throw new NotFoundException();
    }

    if (objectType === ObjectType.ARTIST) {
      const artist = await this.artistService.getArtist(objectId);
      artist.followers -= 1;
      await this.artistService.upsert(artist);
    } else if (objectType === ObjectType.PLAYLIST) {
      const playlist = await this.playlistService.getPlaylist(objectId);
      playlist.followers -= 1;
      await this.playlistService.upsert(playlist);
    } else if (objectType === ObjectType.USER) {
      const user = await this.userService.getUser(Number(objectId));
      user.followers -= 1;
      await this.userService.upsert(user);
    }

    return await this.likeRepository.delete({
      userId: user.id,
      objectType,
      objectId,
    });
  }

  async getLikeObjectsByUser(userId: number, objectType: ObjectType) {
    const objects = await this.likeRepository.find({
      where: {
        userId,
        objectType,
      },
      order: {
        createdAt: 'desc',
      },
    });
    if (objectType === ObjectType.TRACK) {
      const trackMap = await this.trackService.getTracks(objects.map((object) => object.objectId));
      return objects.map((object) => ({
        ...object,
        track: trackMap.get(object.objectId),
      }));
    }
    if (objectType === ObjectType.ALBUM) {
      const albumMap = await this.albumService.getAlbums(objects.map((object) => object.objectId));
      return objects.map((object) => ({
        ...object,
        album: albumMap.get(object.objectId),
      }));
    }
    if (objectType === ObjectType.ARTIST) {
      const artistMap = await this.artistService.getArtists(objects.map((object) => object.objectId));
      return objects.map((object) => ({
        ...object,
        artist: artistMap.get(object.objectId),
      }));
    }
    if (objectType === ObjectType.PLAYLIST) {
      const playlistMap = await this.playlistService.getPlaylists(objects.map((object) => object.objectId));
      return objects.map((object) => ({
        ...object,
        playlist: playlistMap.get(object.objectId),
      }));
    }
    if (objectType === ObjectType.USER) {
      const userMap = await this.userService.getUsers(objects.map((object) => Number(object.objectId)));
      return objects.map((object) => ({
        ...object,
        user: userMap.get(Number(object.objectId)),
      }));
    }
  }

  async getUsersByObject(objectType: ObjectType, objectId: string) {
    const likes = await this.likeRepository.find({
      where: {
        objectType,
        objectId,
      },
      order: {
        createdAt: 'desc',
      },
    });
    const users = await this.userService.getUsers(likes.map((like) => like.userId));
    return users;
  }

  async deleteLikes(objectType: ObjectType, objectId: string) {
    return await this.likeRepository.delete({
      objectType,
      objectId,
    });
  }
}
