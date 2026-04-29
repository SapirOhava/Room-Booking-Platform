import {
  Get,
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
  Param,
  Patch,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @UseGuards(JwtAuthGuard)
  @Throttle({ medium: { limit: 10, ttl: 10000 } })
  @Post()
  async createBooking(@Req() req: any, @Body() dto: CreateBookingDto) {
    return this.bookingsService.createBooking(req.user.id, dto);
  }

  @Get('my')
  async getMyBookings(@Req() req: any) {
    return this.bookingsService.getMyBookings(req.user.id);
  }

  @Patch(':id/cancel')
  async cancelBooking(@Req() req: any, @Param('id') id: string) {
    return this.bookingsService.cancelBooking(req.user.id, id);
  }
}
