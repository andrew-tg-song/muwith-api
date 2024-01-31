import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';
import { User } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';
import { SignupBySsoDto, SsoPlatform } from './dto/signup-by-sso.dto';
import { TransferSsoTokenDto } from './dto/transfer-sso-token.dto';
import { JwtPayload } from './jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  private issueToken(user: User) {
    const payload: JwtPayload = { sub: user.id };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  // https://cloud.google.com/docs/authentication/token-types?hl=ko#id
  private async verifyGoogleIdToken(googleIdToken: string) {
    try {
      const response = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${googleIdToken}`);
      const data: { sub: string } = response.data;
      return data.sub;
    } catch (error) {
      throw new UnauthorizedException('An invalid Google ID token.');
    }
  }

  // https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api#get-token-info
  private async verifyKakaoAccessToken(kakaoAccessToken: string) {
    throw new BadRequestException('Not yet implemented feature.', kakaoAccessToken);
  }

  private async verifySsoToken(platform: SsoPlatform, token: string) {
    if (platform === 'develop') {
      return token;
    }
    if (platform === 'google') {
      return await this.verifyGoogleIdToken(token);
    }
    if (platform === 'kakao') {
      return await this.verifyKakaoAccessToken(token);
    }
    throw new BadRequestException('Wrong SSO platform.');
  }

  async signupBySso({ platform, token, name }: SignupBySsoDto) {
    const ssoId = await this.verifySsoToken(platform, token);
    const loginId = `${platform}:${ssoId}`;
    const user = await this.userService.findOneByLoginId(loginId);
    if (user) {
      throw new BadRequestException('The user already exists.');
    }
    return await this.userService.create({ loginId, name });
  }

  /**
   * @description Exchange SSO access tokens for muwith's internal access tokens.
   */
  async transferSsoToken({ platform, token }: TransferSsoTokenDto) {
    const ssoId = await this.verifySsoToken(platform, token);
    const user = await this.userService.findOneByLoginId(`${platform}:${ssoId}`);
    if (!user) {
      throw new ForbiddenException();
    }
    return this.issueToken(user);
  }
}
