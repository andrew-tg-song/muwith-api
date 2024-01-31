import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupBySsoDto } from './dto/signup-by-sso.dto';
import { TransferSsoTokenDto } from './dto/transfer-sso-token.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup-by-sso')
  async signupBySso(@Body() dto: SignupBySsoDto) {
    return await this.authService.signupBySso(dto);
  }

  @Post('transfer-sso-token')
  async transferSsoToken(@Body() dto: TransferSsoTokenDto) {
    return await this.authService.transferSsoToken(dto);
  }
}
