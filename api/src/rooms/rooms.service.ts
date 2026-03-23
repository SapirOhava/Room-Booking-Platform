import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { SearchRoomsQueryDto } from './dto/search-rooms-query.dto';

@Injectable()
export class RoomsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async searchRooms(query: SearchRoomsQueryDto) {
    const { city, guests, minPrice, maxPrice } = query;

    const cacheKey = [
      'rooms:search',
      city ?? 'all',
      guests ?? 'all',
      minPrice ?? 'all',
      maxPrice ?? 'all',
    ].join(':');

    try {
      const cachedRooms = await this.cacheManager.get<any[]>(cacheKey);

      if (cachedRooms) {
        console.log('cacheee redis worksssss');
        console.log('cachedRooms: ', cachedRooms);
        return cachedRooms;
      }
    } catch {
      // fail open: if Redis is down, still continue to DB
    }

    const rooms = await this.prisma.room.findMany({
      where: {
        ...(city
          ? {
              city: {
                equals: city,
                mode: 'insensitive',
              },
            }
          : {}),
        ...(guests
          ? {
              capacity: {
                gte: guests,
              },
            }
          : {}),
        ...(minPrice !== undefined || maxPrice !== undefined
          ? {
              pricePerNight: {
                ...(minPrice !== undefined ? { gte: minPrice } : {}),
                ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
              },
            }
          : {}),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('using postgress not redisss');
    console.log('rooms: ', rooms);
    try {
      await this.cacheManager.set(cacheKey, rooms, 60_000);
    } catch {
      // fail open: if cache write fails, still return DB result
    }

    return rooms;
  }
}
