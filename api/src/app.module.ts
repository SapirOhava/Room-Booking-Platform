import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import KeyvRedis from '@keyv/redis';
import { Keyv } from 'keyv';

import { PrismaModule } from './prisma/prisma.module';
import { RoomsModule } from './rooms/rooms.module';
import { BookingsModule } from './bookings/bookings.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    PrismaModule,
    RoomsModule,
    BookingsModule,
    AuthModule,
    HealthModule,

    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),

    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        stores: [
          new Keyv({
            store: new KeyvRedis(
              process.env.REDIS_URL || 'redis://localhost:6379',
            ),
          }),
        ],
      }),
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
