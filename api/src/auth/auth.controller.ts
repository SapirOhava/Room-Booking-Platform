import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Register a new user' })
  @ApiOkResponse({ description: 'User registered successfully' })
  @ApiBadRequestResponse({
    description: 'Validation error or email already exists',
  })
  @ApiTooManyRequestsResponse({ description: 'Too many requests' })
  @Throttle({
    short: { limit: 2, ttl: 1000 },
    medium: { limit: 5, ttl: 10000 },
  })
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @ApiOperation({ summary: 'Login and receive JWT access token' })
  @ApiOkResponse({ description: 'Login successful' })
  @ApiBadRequestResponse({ description: 'Validation error' })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
  @ApiTooManyRequestsResponse({ description: 'Too many requests' })
  @Throttle({
    short: { limit: 3, ttl: 1000 },
    medium: { limit: 5, ttl: 10000 },
  })
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiBearerAuth('access-token')
  @ApiOkResponse({ description: 'Current user returned' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req: any) {
    return req.user;
  }
}
