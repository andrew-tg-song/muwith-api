import {
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { GuardedRequest } from 'src/interface/request';
import { FileInterceptor } from '@nestjs/platform-express';
import * as path from 'path';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

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
}
