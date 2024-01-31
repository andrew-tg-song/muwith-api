import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AwsCredentialIdentity } from '@smithy/types';

@Injectable()
export class AwsCredentialsService {
  constructor(private readonly configService: ConfigService) {}

  getCredentials(): AwsCredentialIdentity {
    return {
      accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY'),
      secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
    };
  }
}
