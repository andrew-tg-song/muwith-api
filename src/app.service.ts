import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor() {}

  getHello() {
    return 'HI, I AM MUWITH API!';
  }
}
