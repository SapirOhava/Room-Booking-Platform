import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'sapir@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Sapir Ohava' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 'secret123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;
}
