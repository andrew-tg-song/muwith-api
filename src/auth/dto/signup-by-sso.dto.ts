export type SsoPlatform = 'develop' | 'google' | 'kakao';

export class SignupBySsoDto {
  platform: SsoPlatform;
  token: string;
  name: string;
}
