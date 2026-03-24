import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @ApiOperation({ summary: 'Create a booking for the authenticated user' })
  @ApiBearerAuth('access-token')
  @ApiCreatedResponse({ description: 'Booking created successfully' })
  @ApiBadRequestResponse({
    description: 'Invalid dates or room unavailable',
  })
  @ApiNotFoundResponse({ description: 'User or room not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
  @ApiTooManyRequestsResponse({ description: 'Too many requests' })
  @UseGuards(JwtAuthGuard)
  @Throttle({ medium: { limit: 10, ttl: 10000 } })
  @Post()
  async createBooking(@Req() req: any, @Body() dto: CreateBookingDto) {
    return this.bookingsService.createBooking(req.user.id, dto);
  }
}
