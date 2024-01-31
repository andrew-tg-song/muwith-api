import { Module } from '@nestjs/common';
import { AwsCredentialsService } from './aws-credentials.service';
import { S3Service } from './s3/s3.service';

@Module({
  providers: [AwsCredentialsService, S3Service],
  exports: [S3Service],
})
export class AwsModule {}
