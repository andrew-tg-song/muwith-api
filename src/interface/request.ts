import { Request } from 'express';
import { GuardUser } from 'src/auth/jwt.strategy';

export type RequestInterface = Request & { user: GuardUser };
