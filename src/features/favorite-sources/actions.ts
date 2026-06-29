"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  favoriteSourceFormSchema,
  favoriteSourceIdSchema
} from "@/features/favorite-sources/schemas";
import { FavoriteSourceService } from "@/features/favorite-sources/service";
import { getCurrentHouseholdOrRedirect } from "@/lib/auth/current-household";
import { assertCanManageHousehold } from "@/lib/auth/permissions";

const favoriteSourceService = new FavoriteSourceService();

function parseFavoriteSourceForm(formData: FormData) {
  return favoriteSourceFormSchema.parse({
    type: formData.get("type"),
    name: formData.get("name"),
    url: formData.get("url"),
    rankingBoost: formData.get("rankingBoost"),
    notes: formData.get("notes")
  });
}

function revalidateFavoriteSourceViews() {
  revalidatePath("/favorite-sources");
  revalidatePath("/recipes/search");
}

export async function createFavoriteSourceAction(formData: FormData) {
  const context = await getCurrentHouseholdOrRedirect();
  assertCanManageHousehold(context);
  const input = parseFavoriteSourceForm(formData);

  await favoriteSourceService.createFavoriteSource(context, input);
  revalidateFavoriteSourceViews();
  redirect("/favorite-sources?status=created");
}

export async function updateFavoriteSourceAction(formData: FormData) {
  const context = await getCurrentHouseholdOrRedirect();
  assertCanManageHousehold(context);
  const { id } = favoriteSourceIdSchema.parse({ id: formData.get("id") });
  const input = parseFavoriteSourceForm(formData);

  await favoriteSourceService.updateFavoriteSource(context, id, input);
  revalidateFavoriteSourceViews();
  redirect("/favorite-sources?status=updated");
}

export async function deleteFavoriteSourceAction(formData: FormData) {
  const context = await getCurrentHouseholdOrRedirect();
  assertCanManageHousehold(context);
  const { id } = favoriteSourceIdSchema.parse({ id: formData.get("id") });

  await favoriteSourceService.deleteFavoriteSource(context, id);
  revalidateFavoriteSourceViews();
  redirect("/favorite-sources?status=deleted");
}
