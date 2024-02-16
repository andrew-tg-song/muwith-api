import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
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

  // For debug
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  // For debug
  @Get()
  findAll() {
    return this.userService.findAll();
  }

  // For debug
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  // For debug
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(+id, updateUserDto);
  }

  // For debug
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
}
