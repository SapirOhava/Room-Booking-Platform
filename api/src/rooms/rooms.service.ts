import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchRoomsQueryDto } from './dto/search-rooms-query.dto';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async searchRooms(query: SearchRoomsQueryDto) {
    const { city, guests, minPrice, maxPrice } = query;

    return this.prisma.room.findMany({
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
  }
}
