import { ObjectCannedACL, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { AwsCredentialsService } from '../aws-credentials.service';
import { ConfigService } from '@nestjs/config';

interface S3ObjectPathInput {
  region?: string;
  bucketName?: string;
  objectPath: string;
}

@Injectable()
export class S3Service {
  private readonly region: string;
  private readonly s3Client: S3Client;
  private readonly publicBucketName: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly awsCredentialsService: AwsCredentialsService,
  ) {
    this.region = this.configService.get<string>('AWS_S3_REGION');
    this.s3Client = new S3Client({
      region: this.region,
      credentials: this.awsCredentialsService.getCredentials(),
    });
    this.publicBucketName = this.configService.get<string>('AWS_S3_PUBLIC_BUCKET_NAME');
  }

  private getObjectURL({ region = this.region, bucketName = this.publicBucketName, objectPath }: S3ObjectPathInput) {
    if (objectPath.startsWith('/')) {
      objectPath = objectPath.substring(1);
    }
    return `https://${bucketName}.s3.${region}.amazonaws.com/${objectPath}`;
  }

  async upload(
    file: Buffer,
    { region = this.region, bucketName = this.publicBucketName, objectPath }: S3ObjectPathInput,
    acl: ObjectCannedACL = 'public-read',
  ) {
    const command = new PutObjectCommand({
      Body: file,
      Bucket: bucketName,
      Key: objectPath,
      ACL: acl,
    });
    await this.s3Client.send(command);
    return { objectUrl: this.getObjectURL({ region, bucketName, objectPath }) };
  }
}
