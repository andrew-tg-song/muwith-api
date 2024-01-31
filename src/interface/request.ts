import { Request } from 'express';
import { User } from 'src/user/entities/user.entity';

export type RequestInterface = Request & { user: User };
