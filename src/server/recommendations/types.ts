export type MealRecommendationInput = {
  householdId: string;
  participantMemberIds: string[];
  servings: number;
};

export type MealRecommendation = {
  recipeId: string;
  score: number;
  reasons: string[];
};

export interface MealRecommendationService {
  recommendMeals(input: MealRecommendationInput): Promise<MealRecommendation[]>;
}
