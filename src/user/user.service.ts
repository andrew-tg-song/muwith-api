import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { v4 } from 'uuid';
import { S3Service } from 'src/aws/s3/s3.service';
import * as crypto from 'crypto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly s3Service: S3Service,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const loginIdHash = crypto.createHash('sha256').update(createUserDto.loginId).digest('hex');
    const profileImage = `https://gravatar.com/avatar/${loginIdHash}?d=retro`;
    return await this.userRepository.save({
      ...createUserDto,
      profileImage,
    });
  }

  async findOne(userId: number) {
    return await this.userRepository.findOneBy({ id: userId });
  }

  async findOneByLoginId(loginId: string) {
    return await this.userRepository.findOneBy({ loginId });
  }

  async uploadProfileImage(user: User, file: Buffer, fileExt: string) {
    const fileName = v4() + fileExt;
    const response = await this.s3Service.upload(file, { objectPath: fileName });
    user.profileImage = response.objectUrl;
    return await this.userRepository.save(user);
  }
}
