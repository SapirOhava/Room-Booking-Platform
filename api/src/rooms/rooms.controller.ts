import { Controller, Get, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { RoomsService } from './rooms.service';
import { SearchRoomsQueryDto } from './dto/search-rooms-query.dto';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Throttle({
    medium: { limit: 20, ttl: 10000 },
    long: { limit: 100, ttl: 60000 },
  })
  @Get('search')
  async searchRooms(@Query() query: SearchRoomsQueryDto) {
    return this.roomsService.searchRooms(query);
  }
}
