import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { Response } from 'express';
import type { AuthRequest } from '../common/types/auth-request.type';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

// @Inject with a string exists — to pick one specific instance out of multiple instances of the same class.
@Controller('auth')
export class AuthController {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
  ) {}

  @Throttle({
    short: { limit: 2, ttl: 1000 },
    medium: { limit: 5, ttl: 10000 },
  })
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return firstValueFrom(this.authClient.send({ cmd: 'register' }, dto));
  }

  @Throttle({
    short: { limit: 3, ttl: 1000 },
    medium: { limit: 5, ttl: 10000 },
  })
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await firstValueFrom(
      this.authClient.send({ cmd: 'login' }, dto),
    );
    res.cookie('access_token', result.accessToken, {
      httpOnly: true, // JS cannot read it
      sameSite: 'lax', // protects against CSRF
      secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });
    return result.user; // return user info but NOT the token
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token');
    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req: AuthRequest) {
    return req.user;
  }
}
