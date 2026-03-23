import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import type { Room } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SearchRoomsQueryDto } from './dto/search-rooms-query.dto';

@Injectable()
export class RoomsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async searchRooms(query: SearchRoomsQueryDto): Promise<Room[]> {
    const { city, guests, minPrice, maxPrice } = query;

    // Defensive validation beyond class-validator (cross-field rule).
    if (
      minPrice !== undefined &&
      maxPrice !== undefined &&
      minPrice > maxPrice
    ) {
      throw new BadRequestException(
        'minPrice must be less than or equal to maxPrice',
      );
    }

    const cacheKey = [
      'rooms:search',
      `city=${city?.trim().toLowerCase() || 'all'}`,
      `guests=${guests ?? 'all'}`,
      `minPrice=${minPrice ?? 'all'}`,
      `maxPrice=${maxPrice ?? 'all'}`,
    ].join(':');

    try {
      const cachedRooms = await this.cacheManager.get<Room[]>(cacheKey);
      if (cachedRooms) return cachedRooms;
    } catch {
      // fail-open: DB still works if cache is unavailable
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
      orderBy: { createdAt: 'desc' },
    });

    try {
      // NOTE: some cache stores interpret ttl differently.
      // For Keyv-based Redis in your setup, keep as number and verify behavior.
      await this.cacheManager.set(cacheKey, rooms, 60_000);
    } catch {
      // fail-open
    }

    return rooms;
  }
}
