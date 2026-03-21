import api from "./axios";
import type { Room, SearchRoomsParams } from "../types";

export async function searchRooms(params: SearchRoomsParams): Promise<Room[]> {
  const response = await api.get("/rooms/search", {
    params,
  });

  return response.data;
}
