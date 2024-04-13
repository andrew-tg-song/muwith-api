import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UnsupportedMediaTypeException,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { PlaylistService } from './playlist.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GuardedRequest } from '../interface/request';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';
import { UpdatePlaylistTrackDto } from './dto/update-playlist-track.dto';
import path from 'path';

@Controller('playlist')
export class PlaylistController {
  constructor(private readonly playlistService: PlaylistService) {}

  @Get(':id')
  getPlaylist(@Param('id') id: string) {
    return this.playlistService.getPlaylist(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/')
  async createPlaylist(@Request() req: GuardedRequest, @Body() dto: CreatePlaylistDto) {
    return this.playlistService.createPlaylist(req.user, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updatePlaylist(@Request() req: GuardedRequest, @Param('id') id: string, @Body() dto: UpdatePlaylistDto) {
    return this.playlistService.updatePlaylist(req.user, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deletePlaylist(@Request() req: GuardedRequest, @Param('id') id: string) {
    return this.playlistService.deletePlaylist(req.user, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/:trackId')
  async addTrack(@Request() req: GuardedRequest, @Param('id') id: string, @Param('trackId') trackId: string) {
    return this.playlistService.addTrack(req.user, id, trackId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/:trackId')
  async deleteTrack(@Request() req: GuardedRequest, @Param('id') id: string, @Param('trackId') trackId: string) {
    return this.playlistService.deleteTrack(req.user, id, trackId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/:trackId')
  async updateTrack(
    @Request() req: GuardedRequest,
    @Param('id') id: string,
    @Param('trackId') trackId: string,
    @Body() dto: UpdatePlaylistTrackDto,
  ) {
    return this.playlistService.updateTrack(req.user, id, trackId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/thumbnail-image')
  async uploadThumbnailImage(
    @Request() req: GuardedRequest,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const allowFileFormats = /jpeg|jpg|png|gif/;
    const fileExt = path.extname(file.originalname);
    const isAllowExt = allowFileFormats.test(fileExt.toLowerCase());
    const isAllowMime = allowFileFormats.test(file.mimetype);
    const isAllowFormat = isAllowExt && isAllowMime;
    if (!isAllowFormat) {
      throw new UnsupportedMediaTypeException();
    }
    return this.playlistService.uploadThumbnailImage(req.user, id, file.buffer, fileExt);
  }
}
