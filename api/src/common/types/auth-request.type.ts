import type { Request } from 'express';
import type { AuthUser } from '../../auth/jwt.strategy';

export type AuthRequest = Request & { user: AuthUser };
