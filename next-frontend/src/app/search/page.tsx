'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { searchRooms } from '@/app/api/rooms';
import { createBooking } from '@/app/api/bookings';
import { getFavoriteIds, toggleFavorite } from '@/app/api/favorites';
import { getErrorMessage } from '@/app/utils/getErrorMessage';

import RoomCard from '@/components/rooms/RoomCard';
import type { Room, SearchRoomsParams, CreateBookingData } from '../types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type BookingFormValues = {
  checkIn: string;
  checkOut: string;
};

export default function SearchPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [serverError, setServerError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [bookingMessage, setBookingMessage] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [bookingLoadingRoomId, setBookingLoadingRoomId] = useState<
    string | null
  >(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set()); //a Set instead of an array because you need to check favoriteIds.has(room.id) for every room card. Set.has() is O(1) — instant. Array.includes() is O(n)
  const [isLoggedIn, setIsLoggedIn] = useState(false); //determines whether to show the heart button at all. Set to true if getFavoriteIds() succeeds, false if it throws a 401.- later change to true if getMe() succeeds. or if there's an access token in cookies.

  useEffect(() => {
    // runs once when the page first loads (the empty [] dependency array means "run once on mount"). Fetches the user's favorited room IDs silently. If it fails (user not logged in → 401), we just set isLoggedIn = false and move on — no error shown to the user.
    getFavoriteIds()
      .then((ids) => {
        setFavoriteIds(new Set(ids));
        setIsLoggedIn(true);
      })
      .catch(() => {
        setIsLoggedIn(false);
      });
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SearchRoomsParams>({
    defaultValues: {
      city: '',
      guests: undefined,
      minPrice: undefined,
      maxPrice: undefined,
    },
  });

  async function onSearch(data: SearchRoomsParams) {
    try {
      setServerError('');
      setHasSearched(true);
      setBookingMessage('');
      setBookingError('');

      const cleanParams: SearchRoomsParams = {
        city: data.city?.trim() || undefined,
        guests:
          typeof data.guests === 'number' && !Number.isNaN(data.guests)
            ? data.guests
            : undefined,
        minPrice:
          typeof data.minPrice === 'number' && !Number.isNaN(data.minPrice)
            ? data.minPrice
            : undefined,
        maxPrice:
          typeof data.maxPrice === 'number' && !Number.isNaN(data.maxPrice)
            ? data.maxPrice
            : undefined,
      };

      const result = await searchRooms(cleanParams);
      setRooms(result);
    } catch (error: unknown) {
      setServerError(getErrorMessage(error));
      setRooms([]);
    }
  }

  async function handleBookRoom(roomId: string, values: BookingFormValues) {
    try {
      setBookingMessage('');
      setBookingError('');
      setBookingLoadingRoomId(roomId);

      const bookingData: CreateBookingData = {
        roomId,
        checkIn: new Date(values.checkIn).toISOString(),
        checkOut: new Date(values.checkOut).toISOString(),
      };

      await createBooking(bookingData);
      setBookingMessage('Booking created successfully.');
    } catch (error: unknown) {
      setBookingError(getErrorMessage(error));
    } finally {
      setBookingLoadingRoomId(null);
    }
  }

  async function handleToggleFavorite(roomId: string) {
    const result = await toggleFavorite(roomId);
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (result.favorited) {
        next.add(roomId);
      } else {
        next.delete(roomId);
      }
      return next;
    });
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Search Rooms</CardTitle>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handleSubmit(onSearch)}
            className="grid gap-4 md:grid-cols-2"
            noValidate
          >
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                type="text"
                placeholder="e.g. Tel Aviv"
                {...register('city')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guests">Guests</Label>
              <Input
                id="guests"
                type="number"
                min="1"
                placeholder="e.g. 2"
                {...register('guests', {
                  valueAsNumber: true,
                  min: { value: 1, message: 'Guests must be at least 1' },
                })}
              />
              {errors.guests ? (
                <p className="text-sm text-red-600">{errors.guests.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="minPrice">Min price</Label>
              <Input
                id="minPrice"
                type="number"
                min="0"
                placeholder="e.g. 200"
                {...register('minPrice', {
                  valueAsNumber: true,
                  min: { value: 0, message: 'Min price cannot be negative' },
                })}
              />
              {errors.minPrice ? (
                <p className="text-sm text-red-600">
                  {errors.minPrice.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxPrice">Max price</Label>
              <Input
                id="maxPrice"
                type="number"
                min="0"
                placeholder="e.g. 800"
                {...register('maxPrice', {
                  valueAsNumber: true,
                  min: { value: 0, message: 'Max price cannot be negative' },
                })}
              />
              {errors.maxPrice ? (
                <p className="text-sm text-red-600">
                  {errors.maxPrice.message}
                </p>
              ) : null}
            </div>

            <div className="md:col-span-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </form>

          {serverError ? (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {serverError}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {!hasSearched ? (
            <p className="text-sm text-muted-foreground">
              Search for rooms to see available results.
            </p>
          ) : null}

          {hasSearched && rooms.length === 0 && !serverError ? (
            <p className="text-sm text-muted-foreground">No rooms found.</p>
          ) : null}

          {bookingMessage ? (
            <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              {bookingMessage}
            </div>
          ) : null}

          {bookingError ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {bookingError}
            </div>
          ) : null}

          {rooms.length > 0 ? (
            <div className="space-y-4">
              {rooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  isBooking={bookingLoadingRoomId === room.id}
                  onBook={handleBookRoom}
                  isFavorited={favoriteIds.has(room.id)}
                  onToggleFavorite={
                    isLoggedIn ? handleToggleFavorite : undefined
                  }
                />
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
