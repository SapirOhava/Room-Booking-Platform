import { Controller, Get, Query } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { SearchRoomsQueryDto } from './dto/search-rooms-query.dto';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get('search')
  async searchRooms(@Query() query: SearchRoomsQueryDto) {
    return this.roomsService.searchRooms(query);
  }
}
