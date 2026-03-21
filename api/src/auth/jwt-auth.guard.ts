// In NestJS, a guard runs before the route handler
// and decides whether the request is allowed to continue.
// This JWT guard tells Nest to authenticate the request
// using the "jwt" strategy before entering protected routes.
// If the token is valid, the request continues.
// If the token is missing or invalid, the request is rejected.

import { AuthGuard } from '@nestjs/passport';

export class JwtAuthGuard extends AuthGuard('jwt') {}
