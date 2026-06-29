export type GroceryNormalizationInput = {
  name: string;
  unit?: string;
};

export type GroceryNormalizationResult = {
  normalizedName: string;
  category?: string;
};

export interface GroceryNormalizer {
  normalize(input: GroceryNormalizationInput): GroceryNormalizationResult;
}
