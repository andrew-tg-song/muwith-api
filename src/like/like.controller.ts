import { Controller, Delete, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { LikeService } from './like.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ObjectType } from '../constants';
import { GuardedRequest } from '../interface/request';

@Controller('like')
export class LikeController {
  constructor(private readonly likeService: LikeService) {}

  @UseGuards(JwtAuthGuard)
  @Post(':objectType/:objectId')
  async like(
    @Request() req: GuardedRequest,
    @Param('objectType') objectType: ObjectType,
    @Param('objectId') objectId: string,
  ) {
    return await this.likeService.like(req.user, objectType, objectId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':objectType/:objectId')
  async unlike(
    @Request() req: GuardedRequest,
    @Param('objectType') objectType: ObjectType,
    @Param('objectId') objectId: string,
  ) {
    return await this.likeService.unlike(req.user, objectType, objectId);
  }

  @Get(':objectType/:objectId/users')
  async getUsersByObject(@Param('objectType') objectType: ObjectType, @Param('objectId') objectId: string) {
    return await this.likeService.getUsersByObject(objectType, objectId);
  }
}
