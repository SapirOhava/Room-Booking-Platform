import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';

import { AuthService } from './auth.service';

jest.mock('argon2', () => ({
  hash: jest.fn(),
  verify: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const jwtServiceMock = {
    signAsync: jest.fn(),
  } as unknown as JwtService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(prismaMock as any, jwtServiceMock);
  });

  it('register: throws when email already exists', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'u1' });

    await expect(
      service.register({
        email: 'sapir@example.com',
        fullName: 'Sapir',
        password: 'secret123',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('login: throws when user not found', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(
      service.login({ email: 'missing@example.com', password: 'secret123' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('login: returns token + user on success', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'sapir@example.com',
      fullName: 'Sapir',
      passwordHash: 'hashed',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    (argon2.verify as jest.Mock).mockResolvedValue(true);
    (jwtServiceMock.signAsync as jest.Mock).mockResolvedValue('jwt-token');

    const result = await service.login({
      email: 'sapir@example.com',
      password: 'secret123',
    });

    expect(result.accessToken).toBe('jwt-token');
    expect(result.user.email).toBe('sapir@example.com');
  });
});
