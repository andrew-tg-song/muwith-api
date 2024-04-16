import {
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  UnsupportedMediaTypeException,
  Param,
  forwardRef,
  Inject,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { GuardedRequest } from 'src/interface/request';
import { FileInterceptor } from '@nestjs/platform-express';
import * as path from 'path';
import { LikeService } from '../like/like.service';
import { ListenableObjectType, ObjectType } from '../constants';
import { PlaylistService } from '../playlist/playlist.service';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    @Inject(forwardRef(() => LikeService))
    private readonly likeService: LikeService,
    @Inject(forwardRef(() => PlaylistService))
    private readonly playlistService: PlaylistService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyProfile(@Request() req: GuardedRequest) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile-image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfileImage(@Request() req: GuardedRequest, @UploadedFile() file: Express.Multer.File) {
    const allowFileFormats = /jpeg|jpg|png|gif/;
    const fileExt = path.extname(file.originalname);
    const isAllowExt = allowFileFormats.test(fileExt.toLowerCase());
    const isAllowMime = allowFileFormats.test(file.mimetype);
    const isAllowFormat = isAllowExt && isAllowMime;
    if (!isAllowFormat) {
      throw new UnsupportedMediaTypeException();
    }
    return this.userService.uploadProfileImage(req.user, file.buffer, fileExt);
  }

  @Get(':id/like/:objectType')
  async getUserLikeObjects(@Param('id') id: string, @Param('objectType') objectType: ObjectType) {
    return await this.likeService.getLikeObjectsByUser(Number(id), objectType);
  }

  @Get(':id/like/:objectType/simplify')
  async getUserLikeObjectsSimplify(
    @Param('id') id: string,
    @Param('objectType') objectType: ObjectType,
    @Query('objectIds') objectIds: string,
  ) {
    return await this.likeService.getLikeObjectsByUserSimplify(Number(id), objectType, objectIds.split(','));
  }

  @UseGuards(JwtAuthGuard)
  @Post('log/:objectType/play/:objectId')
  async logPlay(
    @Request() req: GuardedRequest,
    @Param('objectType') objectType: ListenableObjectType,
    @Param('objectId') objectId: string,
  ) {
    return await this.userService.logPlay(req.user, objectType, objectId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('log/all/play/random')
  async getRandomPlayedObjects(@Request() req: GuardedRequest) {
    return await this.userService.getRandomPlayedObjects(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('log/track/listen/:trackId')
  async logTrackListen(@Request() req: GuardedRequest, @Param('trackId') trackId: string) {
    return await this.userService.logTrackListen(req.user, trackId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('log/track/listen/frequent')
  async getFrequentListenedTracks(@Request() req: GuardedRequest) {
    return await this.userService.getFrequentListenedTracks(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('log/track/listen/recently')
  async getRecentlyListenedTracks(@Request() req: GuardedRequest) {
    return await this.userService.getRecentlyListenedTracks(req.user);
  }

  @Get(':id/playlist')
  async getPlaylists(@Param('id') id: string) {
    return await this.playlistService.getUserPlaylists(Number(id));
  }
}
