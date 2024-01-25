import { SsoPlatform } from './signup-by-sso.dto';

export class TransferSsoTokenDto {
  platform: SsoPlatform;
  token: string;
}
