export type SsoPlatform = 'google' | 'kakao';

export class SignupBySsoDto {
  platform: SsoPlatform;
  token: string;
  name: string;
}
