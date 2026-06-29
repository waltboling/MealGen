export type FavoriteSourceType =
  | "WEBSITE"
  | "CREATOR"
  | "BLOG"
  | "PUBLICATION"
  | "CHANNEL";

export type FavoriteSource = {
  id: string;
  type: FavoriteSourceType;
  name: string;
  url: string | null;
  rankingBoost: number;
  notes: string | null;
};

export type FavoriteSourceInput = {
  type: FavoriteSourceType;
  name: string;
  url?: string | null;
  rankingBoost: number;
  notes?: string | null;
};
