import api from './axios';
import type { Room } from '../types';

export async function toggleFavorite(
  roomId: string,
): Promise<{ favorited: boolean }> {
  const response = await api.post(`/favorites/${roomId}`);
  return response.data;
}

export async function getFavorites(): Promise<Room[]> {
  const response = await api.get('/favorites');
  return response.data;
}

export async function getFavoriteIds(): Promise<string[]> {
  const response = await api.get('/favorites/ids');
  return response.data;
}
