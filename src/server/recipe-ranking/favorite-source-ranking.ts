import type { FavoriteSource } from "@/features/favorite-sources/types";
import type { RecipeSearchResult } from "@/server/recipe-providers/types";

export type RankedRecipeSearchResult = RecipeSearchResult & {
  providerName: string;
  favoriteSource: {
    id: string;
    name: string;
    rankingBoost: number;
  } | null;
  rankingScore: number;
};

type SearchResultWithProvider = RecipeSearchResult & {
  providerName: string;
};

function normalize(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function hostname(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  try {
    const url = value.startsWith("http") ? value : `https://${value}`;
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return normalize(value).replace(/^www\./, "");
  }
}

function sourceMatchesResult(source: FavoriteSource, result: SearchResultWithProvider) {
  const sourceName = normalize(source.name);
  const resultSourceName = normalize(result.sourceName);
  const resultAuthorName = normalize(result.authorName);
  const sourceHost = hostname(source.url);
  const resultHost = hostname(result.sourceUrl);

  return (
    Boolean(sourceName) &&
    (sourceName === resultSourceName ||
      sourceName === resultAuthorName ||
      resultSourceName.includes(sourceName) ||
      resultAuthorName.includes(sourceName)) ||
    Boolean(sourceHost) &&
      (sourceHost === resultHost || resultHost.endsWith(`.${sourceHost}`))
  );
}

function bestFavoriteMatch(
  result: SearchResultWithProvider,
  favoriteSources: FavoriteSource[]
) {
  return favoriteSources
    .filter((source) => sourceMatchesResult(source, result))
    .sort((first, second) => second.rankingBoost - first.rankingBoost)[0] ?? null;
}

export function rankRecipeSearchResults(
  results: SearchResultWithProvider[],
  favoriteSources: FavoriteSource[]
): RankedRecipeSearchResult[] {
  return results
    .map((result, index) => {
      const favoriteSource = bestFavoriteMatch(result, favoriteSources);
      const rankingScore = 1000 - index + (favoriteSource?.rankingBoost ?? 0);

      return {
        ...result,
        favoriteSource: favoriteSource
          ? {
              id: favoriteSource.id,
              name: favoriteSource.name,
              rankingBoost: favoriteSource.rankingBoost
            }
          : null,
        rankingScore
      };
    })
    .sort((first, second) => {
      if (second.rankingScore !== first.rankingScore) {
        return second.rankingScore - first.rankingScore;
      }

      return first.title.localeCompare(second.title);
    });
}
