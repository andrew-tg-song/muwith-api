import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IS_PRODUCTION_MODE } from './environment';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';

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
    UserModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
