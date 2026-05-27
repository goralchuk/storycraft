import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AppConfigService } from './config/config.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ChildrenModule } from './children/children.module';
import { TemplatesModule } from './templates/templates.module';
import { BooksModule } from './books/books.module';
import { validate } from './config/env.schema';
import type { Env } from './config/env.schema';

@Module({
  imports: [
    ConfigModule.forRoot({ validate, isGlobal: true }),
    BullModule.forRootAsync({
      useFactory: (config: ConfigService<Env, true>) => ({
        connection: {
          host: config.get('REDIS_HOST', { infer: true }),
          port: config.get('REDIS_PORT', { infer: true }),
        },
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ChildrenModule,
    TemplatesModule,
    BooksModule,
  ],
  controllers: [AppController],
  providers: [AppService, AppConfigService],
})
export class AppModule {}
