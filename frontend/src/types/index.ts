export type RegisterFormData = {
  fullName: string;
  email: string;
  password: string;
};

export type LoginFormData = {
  email: string;
  password: string;
};

export type User = {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
};

export type LoginResponse = {
  accessToken: string;
  user: User;
};

export type RegisterResponse = {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
};

export type SearchRoomsParams = {
  city?: string;
  guests?: number;
  minPrice?: number;
  maxPrice?: number;
};

export type Room = {
  id: string;
  name: string;
  city: string;
  capacity: number;
  pricePerNight: number | string;
  description?: string | null;
  createdAt: string;
};

export type CreateBookingData = {
  roomId: string;
  checkIn: string;
  checkOut: string;
};

export type BookingStatus = "CONFIRMED" | "CANCELLED";

export type Booking = {
  id: string;
  userId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number | string;
  status: BookingStatus;
  createdAt: string;
};
