import { BadRequestException } from '@nestjs/common';

import { RoomsService } from './rooms.service';

describe('RoomsService', () => {
  let service: RoomsService;

  const prismaMock = {
    room: {
      findMany: jest.fn(),
    },
  };

  const cacheManagerMock = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RoomsService(prismaMock as any, cacheManagerMock as any);
  });

  it('throws when minPrice > maxPrice', async () => {
    await expect(
      service.searchRooms({
        minPrice: 900,
        maxPrice: 100,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns cached rooms when cache hit', async () => {
    const cached = [{ id: 'r1', city: 'Tel Aviv' }];
    cacheManagerMock.get.mockResolvedValue(cached);

    const result = await service.searchRooms({ city: 'Tel Aviv' });

    expect(result).toEqual(cached);
    expect(prismaMock.room.findMany).not.toHaveBeenCalled();
  });

  it('queries DB and sets cache on cache miss', async () => {
    cacheManagerMock.get.mockResolvedValue(undefined);
    prismaMock.room.findMany.mockResolvedValue([{ id: 'r2', city: 'Haifa' }]);

    const result = await service.searchRooms({ city: 'Haifa' });

    expect(prismaMock.room.findMany).toHaveBeenCalled();
    expect(cacheManagerMock.set).toHaveBeenCalled();
    expect(result).toEqual([{ id: 'r2', city: 'Haifa' }]);
  });
});
