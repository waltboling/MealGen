import type { CurrentHousehold } from "@/lib/auth/current-household";
import { FavoriteSourceRepository } from "@/server/repositories/favorite-source-repository";

const favoriteSourceRepository = new FavoriteSourceRepository();

export class FavoriteSourceService {
  listFavoriteSources(context: CurrentHousehold) {
    return favoriteSourceRepository.list(context.householdId, context.isDemo);
  }

  createFavoriteSource(
    context: CurrentHousehold,
    input: Parameters<FavoriteSourceRepository["create"]>[2]
  ) {
    return favoriteSourceRepository.create(
      context.householdId,
      context.isDemo,
      input
    );
  }

  updateFavoriteSource(
    context: CurrentHousehold,
    id: string,
    input: Parameters<FavoriteSourceRepository["update"]>[3]
  ) {
    return favoriteSourceRepository.update(
      context.householdId,
      context.isDemo,
      id,
      input
    );
  }

  deleteFavoriteSource(context: CurrentHousehold, id: string) {
    return favoriteSourceRepository.delete(
      context.householdId,
      context.isDemo,
      id
    );
  }
}
