import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConstants } from './constants';
import type { Request } from 'express';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  createdAt: Date;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => (req.cookies.access_token ?? null) as string | null, // from cookie (browser requests)
        ExtractJwt.fromAuthHeaderAsBearerToken(), // from header (server-side Next.js requests)
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload: { sub: string; email: string }) {
    try {
      return await firstValueFrom(
        this.authClient.send({ cmd: 'get_user_by_id' }, { id: payload.sub }),
      );
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
