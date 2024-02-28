import { ObjectCannedACL, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { AwsCredentialsService } from '../aws-credentials.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3Service {
  private readonly endpoint: string | undefined;
  private readonly region: string;
  private readonly s3Client: S3Client;
  private readonly publicBucketName: string;
  private readonly publicBucketUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly awsCredentialsService: AwsCredentialsService,
  ) {
    const endpoint = this.configService.get<string>('AWS_S3_ENDPOINT');
    if (endpoint) {
      this.endpoint = endpoint;
    }
    this.region = this.configService.get<string>('AWS_S3_REGION');
    this.s3Client = new S3Client({
      region: this.region,
      endpoint: this.endpoint,
      credentials: this.awsCredentialsService.getCredentials(),
    });
    this.publicBucketName = this.configService.get<string>('AWS_S3_PUBLIC_BUCKET_NAME');
    this.publicBucketUrl = this.configService.get<string>('AWS_S3_PUBLIC_BUCKET_URL');
  }

  private getPublicObjectURL(objectPath: string) {
    if (objectPath.startsWith('/')) {
      objectPath = objectPath.substring(1);
    }
    return `${this.publicBucketUrl}/${objectPath}`;
  }

  async publicUpload(file: Buffer, objectPath: string, acl: ObjectCannedACL = 'public-read') {
    const command = new PutObjectCommand({
      Body: file,
      Bucket: this.publicBucketName,
      Key: objectPath,
      ACL: acl,
    });
    await this.s3Client.send(command);
    return { objectUrl: this.getPublicObjectURL(objectPath) };
  }
}
