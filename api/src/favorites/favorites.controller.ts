import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FavoritesService } from './favorites.service';
import type { AuthRequest } from '../common/types/auth-request.type';

@UseGuards(JwtAuthGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post(':roomId')
  async toggleFavorite(
    @Req() req: AuthRequest,
    @Param('roomId') roomId: string,
  ) {
    return this.favoritesService.toggleFavorite(req.user.id, roomId);
  }

  @Get()
  async getFavorites(@Req() req: AuthRequest) {
    return this.favoritesService.getFavorites(req.user.id);
  }

  @Get('ids')
  async getFavoriteIds(@Req() req: AuthRequest) {
    return this.favoritesService.getFavoriteIds(req.user.id);
  }
}
