'use client';

import { useState, useEffect } from 'react';
import { getFavorites } from '@/app/api/favorites';
import { getErrorMessage } from '@/app/utils/getErrorMessage';
import type { Room } from '@/app/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function FavoritesPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getFavorites()
      .then((data) => setRooms(data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">My Favorites</h1>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {!error && rooms.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          You haven&apos;t saved any rooms yet. Search for rooms and click the
          heart to save them here.
        </p>
      ) : null}

      {rooms.map((room) => (
        <Card key={room.id}>
          <CardHeader>
            <CardTitle>{room.name}</CardTitle>
            <CardDescription>{room.city}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>
              <span className="font-medium">Price per night:</span>{' '}
              {Number(room.pricePerNight).toFixed(2)}
            </p>
            <p>
              <span className="font-medium">Capacity:</span> {room.capacity}
            </p>
            {room.description ? (
              <p>
                <span className="font-medium">Description:</span>{' '}
                {room.description}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
