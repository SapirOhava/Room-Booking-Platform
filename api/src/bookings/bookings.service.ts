import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async createBooking(userId: string, dto: CreateBookingDto) {
    const { roomId, checkIn, checkOut } = dto;

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkOutDate <= checkInDate) {
      throw new BadRequestException('checkOut must be after checkIn');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const overlappingBooking = await this.prisma.booking.findFirst({
      where: {
        roomId,
        status: 'CONFIRMED',
        checkIn: {
          lt: checkOutDate,
        },
        checkOut: {
          gt: checkInDate,
        },
      },
    });

    if (overlappingBooking) {
      throw new BadRequestException('Room is not available for these dates');
    }

    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    const nights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / millisecondsPerDay,
    );

    const totalPrice = Number(room.pricePerNight) * nights;

    try {
      return await this.prisma.booking.create({
        data: {
          userId,
          roomId,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          totalPrice,
        },
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : String(error ?? '');

      if (message.includes('booking_no_overlap')) {
        throw new BadRequestException({
          code: 'ROOM_NOT_AVAILABLE',
          message: 'Room is not available for these dates',
        });
      }

      if (message.includes('booking_check_dates')) {
        throw new BadRequestException({
          code: 'INVALID_DATE_RANGE',
          message: 'checkOut must be after checkIn',
        });
      }

      throw error;
    }
  }
}
