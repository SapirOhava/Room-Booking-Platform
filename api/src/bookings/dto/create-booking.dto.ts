import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({
    example: 'room_123',
    description: 'Room ID to book',
  })
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @ApiProperty({
    example: '2026-04-01T14:00:00.000Z',
    description: 'Check-in datetime in ISO 8601 format',
  })
  @IsDateString()
  checkIn: string;

  @ApiProperty({
    example: '2026-04-05T11:00:00.000Z',
    description: 'Check-out datetime in ISO 8601 format',
  })
  @IsDateString()
  checkOut: string;
}
