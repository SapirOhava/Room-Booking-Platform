import { useState } from "react";
import type { Room } from "../../types";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

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
    <Card>
      <CardHeader>
        <CardTitle>{room.name}</CardTitle>
        <CardDescription>{room.city}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-1 text-sm">
          <p>
            <span className="font-medium">Price per night:</span>{" "}
            {Number(room.pricePerNight).toFixed(2)}
          </p>
          <p>
            <span className="font-medium">Capacity:</span> {room.capacity}
          </p>
          {room.description && (
            <p>
              <span className="font-medium">Description:</span>{" "}
              {room.description}
            </p>
          )}
        </div>

        <form
          onSubmit={handleSubmitBooking}
          className="grid gap-4 md:grid-cols-3"
        >
          <div className="space-y-2">
            <Label htmlFor={`checkIn-${room.id}`}>Check-in</Label>
            <Input
              id={`checkIn-${room.id}`}
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`checkOut-${room.id}`}>Check-out</Label>
            <Input
              id={`checkOut-${room.id}`}
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
            />
          </div>

          <div className="flex items-end">
            <Button type="submit" className="w-full" disabled={isBooking}>
              {isBooking ? "Booking..." : "Book this room"}
            </Button>
          </div>
        </form>

        {localError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {localError}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default RoomCard;
