import { useState } from "react";
import { useForm } from "react-hook-form";
import { searchRooms } from "../api/rooms";
import { createBooking } from "../api/bookings";
import type { CreateBookingData, Room, SearchRoomsParams } from "../types";
import { getErrorMessage } from "../utils/getErrorMessage";
import RoomCard from "../components/rooms/RoomCard";

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
      <div className="rounded-lg bg-white p-6 shadow">
        <h1 className="mb-6 text-2xl font-bold">Search Rooms</h1>

        <form
          onSubmit={handleSubmit(onSearch)}
          className="grid gap-4 md:grid-cols-2"
        >
          <div>
            <label htmlFor="city" className="mb-1 block text-sm font-medium">
              City
            </label>
            <input
              id="city"
              type="text"
              className="w-full rounded-md border px-3 py-2"
              placeholder="e.g. Tel Aviv"
              {...register("city")}
            />
          </div>

          <div>
            <label htmlFor="guests" className="mb-1 block text-sm font-medium">
              Guests
            </label>
            <input
              id="guests"
              type="number"
              min="1"
              className="w-full rounded-md border px-3 py-2"
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
              <p className="mt-1 text-sm text-red-600">
                {errors.guests.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="minPrice"
              className="mb-1 block text-sm font-medium"
            >
              Min price
            </label>
            <input
              id="minPrice"
              type="number"
              min="0"
              className="w-full rounded-md border px-3 py-2"
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
              <p className="mt-1 text-sm text-red-600">
                {errors.minPrice.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="maxPrice"
              className="mb-1 block text-sm font-medium"
            >
              Max price
            </label>
            <input
              id="maxPrice"
              type="number"
              min="0"
              className="w-full rounded-md border px-3 py-2"
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
              <p className="mt-1 text-sm text-red-600">
                {errors.maxPrice.message}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
            >
              {isSubmitting ? "Searching..." : "Search"}
            </button>
          </div>
        </form>

        {serverError && (
          <p className="mt-4 text-sm text-red-600">{serverError}</p>
        )}
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Results</h2>

        {!hasSearched && (
          <p className="text-slate-600">
            Search for rooms to see available results.
          </p>
        )}

        {hasSearched && rooms.length === 0 && !serverError && (
          <p className="text-slate-600">No rooms found.</p>
        )}

        {bookingMessage && (
          <p className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
            {bookingMessage}
          </p>
        )}

        {bookingError && (
          <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {bookingError}
          </p>
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
      </div>
    </div>
  );
}

export default SearchRoomsPage;
