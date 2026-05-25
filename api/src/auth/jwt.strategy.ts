import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import { jwtConstants } from './constants';
import { Prisma } from '@prisma/client';

const userSelect = {
  id: true,
  email: true,
  fullName: true,
  createdAt: true,
} satisfies Prisma.UserSelect;
// Export the derived type — automatically matches the select above
export type AuthUser = Prisma.UserGetPayload<{ select: typeof userSelect }>;

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => req?.cookies?.access_token ?? null, // from cookie (browser requests)
        ExtractJwt.fromAuthHeaderAsBearerToken(), // from header (server-side Next.js requests)
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload: { sub: string; email: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: userSelect,
    });

    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }

    return user;
  }
}
