import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IS_PRODUCTION_MODE } from './constants';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { AwsModule } from './aws/aws.module';

@Module({
  imports: [
    // https://typeorm.io/data-source-options#common-data-source-options
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'muwith.db',
      autoLoadEntities: true,
      synchronize: !IS_PRODUCTION_MODE,
      logging: !IS_PRODUCTION_MODE,
      dropSchema: false,
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    UserModule,
    AuthModule,
    AwsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
