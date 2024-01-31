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
import { RequestInterface } from 'src/interface/request';
import { FileInterceptor } from '@nestjs/platform-express';
import * as path from 'path';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyProfile(@Request() req: RequestInterface) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile-image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfileImage(@Request() req: RequestInterface, @UploadedFile() file: Express.Multer.File) {
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

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
}
