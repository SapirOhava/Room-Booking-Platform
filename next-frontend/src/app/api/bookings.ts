import api from "./axios";
import type { Booking, CreateBookingData } from "../types";

export async function createBooking(data: CreateBookingData): Promise<Booking> {
  const response = await api.post("/bookings", data);
  return response.data;
}
