"use client";

import { useState, type SubmitEventHandler } from "react";
import type { Room } from "@/app/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type BookingFormValues = {
  checkIn: string;
  checkOut: string;
};

type RoomCardProps = {
  room: Room;
  isBooking: boolean;
  onBook: (roomId: string, values: BookingFormValues) => Promise<void>;
};

export default function RoomCard({ room, isBooking, onBook }: RoomCardProps) {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [localError, setLocalError] = useState("");

  const handleSubmitBooking: SubmitEventHandler<HTMLFormElement> = async (
    e,
  ) => {
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

    try {
      await onBook(room.id, { checkIn, checkOut });
    } catch {
      setLocalError("Failed to create booking. Please try again.");
    }
  };

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

          {room.description ? (
            <p>
              <span className="font-medium">Description:</span>{" "}
              {room.description}
            </p>
          ) : null}
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

        {localError ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {localError}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
