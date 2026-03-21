import { useState } from "react";
import type { Room } from "../../types";

type BookingFormValues = {
  checkIn: string;
  checkOut: string;
};

type RoomCardProps = {
  room: Room;
  isBooking: boolean;
  onBook: (roomId: string, values: BookingFormValues) => Promise<void>;
};

function RoomCard({ room, isBooking, onBook }: RoomCardProps) {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [localError, setLocalError] = useState("");

  async function handleSubmitBooking(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLocalError("");

    if (!checkIn || !checkOut) {
      setLocalError("Check-in and check-out are required.");
      return;
    }

    if (new Date(checkOut) <= new Date(checkIn)) {
      setLocalError("Check-out must be after check-in.");
      return;
    }

    await onBook(room.id, { checkIn, checkOut });
  }

  return (
    <div className="rounded-md border p-4">
      <h3 className="text-lg font-semibold">{room.name}</h3>
      <p className="text-sm text-slate-600">{room.city}</p>

      <div className="mt-3 space-y-1 text-sm">
        <p>
          <span className="font-medium">Price per night:</span>{" "}
          {Number(room.pricePerNight).toFixed(2)}
        </p>
        <p>
          <span className="font-medium">Capacity:</span> {room.capacity}
        </p>
        {room.description && (
          <p>
            <span className="font-medium">Description:</span> {room.description}
          </p>
        )}
      </div>

      <form
        onSubmit={handleSubmitBooking}
        className="mt-4 grid gap-3 md:grid-cols-3"
      >
        <div>
          <label className="mb-1 block text-sm font-medium">Check-in</label>
          <input
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Check-out</label>
          <input
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={isBooking}
            className="w-full rounded-md bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
          >
            {isBooking ? "Booking..." : "Book this room"}
          </button>
        </div>
      </form>

      {localError && <p className="mt-3 text-sm text-red-600">{localError}</p>}
    </div>
  );
}

export default RoomCard;
