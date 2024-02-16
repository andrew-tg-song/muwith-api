import { Request } from 'express';
import { User } from 'src/user/entities/user.entity';

export type GuardedRequest = Request & { user: User };
