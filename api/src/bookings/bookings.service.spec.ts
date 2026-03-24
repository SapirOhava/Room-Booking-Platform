import { BadRequestException, NotFoundException } from '@nestjs/common';

import { BookingsService } from './bookings.service';

describe('BookingsService', () => {
  let service: BookingsService;

  const prismaMock = {
    user: { findUnique: jest.fn() },
    room: { findUnique: jest.fn() },
    booking: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BookingsService(prismaMock as any);
  });

  it('throws when checkOut <= checkIn', async () => {
    await expect(
      service.createBooking('u1', {
        roomId: 'r1',
        checkIn: '2026-04-10T10:00:00.000Z',
        checkOut: '2026-04-10T10:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws when user not found', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(
      service.createBooking('u-missing', {
        roomId: 'r1',
        checkIn: '2026-04-10T10:00:00.000Z',
        checkOut: '2026-04-12T10:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws when room is overlapping booking', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'u1' });
    prismaMock.room.findUnique.mockResolvedValue({
      id: 'r1',
      pricePerNight: 200,
    });
    prismaMock.booking.findFirst.mockResolvedValue({ id: 'b1' });

    await expect(
      service.createBooking('u1', {
        roomId: 'r1',
        checkIn: '2026-04-10T10:00:00.000Z',
        checkOut: '2026-04-12T10:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates booking successfully', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'u1' });
    prismaMock.room.findUnique.mockResolvedValue({
      id: 'r1',
      pricePerNight: 200,
    });
    prismaMock.booking.findFirst.mockResolvedValue(null);
    prismaMock.booking.create.mockResolvedValue({ id: 'b1' });

    const result = await service.createBooking('u1', {
      roomId: 'r1',
      checkIn: '2026-04-10T10:00:00.000Z',
      checkOut: '2026-04-12T10:00:00.000Z',
    });

    expect(prismaMock.booking.create).toHaveBeenCalled();
    expect(result).toEqual({ id: 'b1' });
  });
});
