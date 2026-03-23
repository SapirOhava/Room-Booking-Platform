import { useState } from "react";
import { useForm } from "react-hook-form";

import { searchRooms } from "../api/rooms";
import { createBooking } from "../api/bookings";
import type { CreateBookingData, Room, SearchRoomsParams } from "../types";
import { getErrorMessage } from "../utils/getErrorMessage";
import RoomCard from "../components/rooms/RoomCard";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

type BookingFormValues = {
  checkIn: string;
  checkOut: string;
};

function SearchRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [serverError, setServerError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [bookingLoadingRoomId, setBookingLoadingRoomId] = useState<
    string | null
  >(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SearchRoomsParams>({
    defaultValues: {
      city: "",
    },
  });

  async function onSearch(data: SearchRoomsParams) {
    try {
      setServerError("");
      setHasSearched(true);
      setBookingMessage("");
      setBookingError("");

      const cleanParams: SearchRoomsParams = {
        city: data.city?.trim() || undefined,
        guests:
          typeof data.guests === "number" && !Number.isNaN(data.guests)
            ? data.guests
            : undefined,
        minPrice:
          typeof data.minPrice === "number" && !Number.isNaN(data.minPrice)
            ? data.minPrice
            : undefined,
        maxPrice:
          typeof data.maxPrice === "number" && !Number.isNaN(data.maxPrice)
            ? data.maxPrice
            : undefined,
      };

      const result = await searchRooms(cleanParams);
      setRooms(result);
    } catch (error: any) {
      setServerError(getErrorMessage(error));
      setRooms([]);
    }
  }

  async function handleBookRoom(roomId: string, values: BookingFormValues) {
    try {
      setBookingMessage("");
      setBookingError("");
      setBookingLoadingRoomId(roomId);

      const bookingData: CreateBookingData = {
        roomId,
        checkIn: new Date(values.checkIn).toISOString(),
        checkOut: new Date(values.checkOut).toISOString(),
      };

      await createBooking(bookingData);

      setBookingMessage("Booking created successfully.");
    } catch (error: any) {
      setBookingError(getErrorMessage(error));
    } finally {
      setBookingLoadingRoomId(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Search Rooms</CardTitle>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handleSubmit(onSearch)}
            className="grid gap-4 md:grid-cols-2"
          >
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                type="text"
                placeholder="e.g. Tel Aviv"
                {...register("city")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guests">Guests</Label>
              <Input
                id="guests"
                type="number"
                min="1"
                placeholder="e.g. 2"
                {...register("guests", {
                  valueAsNumber: true,
                  min: {
                    value: 1,
                    message: "Guests must be at least 1",
                  },
                })}
              />
              {errors.guests && (
                <p className="text-sm text-red-600">{errors.guests.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="minPrice">Min price</Label>
              <Input
                id="minPrice"
                type="number"
                min="0"
                placeholder="e.g. 200"
                {...register("minPrice", {
                  valueAsNumber: true,
                  min: {
                    value: 0,
                    message: "Min price cannot be negative",
                  },
                })}
              />
              {errors.minPrice && (
                <p className="text-sm text-red-600">
                  {errors.minPrice.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxPrice">Max price</Label>
              <Input
                id="maxPrice"
                type="number"
                min="0"
                placeholder="e.g. 800"
                {...register("maxPrice", {
                  valueAsNumber: true,
                  min: {
                    value: 0,
                    message: "Max price cannot be negative",
                  },
                })}
              />
              {errors.maxPrice && (
                <p className="text-sm text-red-600">
                  {errors.maxPrice.message}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Searching..." : "Search"}
              </Button>
            </div>
          </form>

          {serverError && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {serverError}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {!hasSearched && (
            <p className="text-sm text-muted-foreground">
              Search for rooms to see available results.
            </p>
          )}

          {hasSearched && rooms.length === 0 && !serverError && (
            <p className="text-sm text-muted-foreground">No rooms found.</p>
          )}

          {bookingMessage && (
            <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              {bookingMessage}
            </div>
          )}

          {bookingError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {bookingError}
            </div>
          )}

          {rooms.length > 0 && (
            <div className="space-y-4">
              {rooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  isBooking={bookingLoadingRoomId === room.id}
                  onBook={handleBookRoom}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default SearchRoomsPage;
