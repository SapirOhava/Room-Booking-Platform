import { Controller, Get, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';

import { RoomsService } from './rooms.service';
import { SearchRoomsQueryDto } from './dto/search-rooms-query.dto';

@ApiTags('rooms')
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @ApiOperation({ summary: 'Search rooms by filters' })
  @ApiQuery({ name: 'city', required: false, type: String })
  @ApiQuery({ name: 'guests', required: false, type: Number })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiOkResponse({ description: 'Matching rooms returned' })
  @ApiBadRequestResponse({ description: 'Invalid query params' })
  @ApiTooManyRequestsResponse({ description: 'Too many requests' })
  @Throttle({
    medium: { limit: 20, ttl: 10000 },
    long: { limit: 100, ttl: 60000 },
  })
  @Get('search')
  async searchRooms(@Query() query: SearchRoomsQueryDto) {
    return this.roomsService.searchRooms(query);
  }
}
