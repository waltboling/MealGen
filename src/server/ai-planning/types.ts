import type { HouseholdProfile } from "../../features/household/types.ts";
import type {
  AiMealSuggestion,
  AiPlanningRequest,
  AiPlanningResult
} from "../../features/ai-planning/types.ts";
import type { RecipeListItem } from "../../features/recipes/types.ts";

export type AiPlanningProviderInput = {
  request: AiPlanningRequest;
  profiles: HouseholdProfile[];
  savedRecipes: RecipeListItem[];
};

export interface AiPlanningProvider {
  id: string;
  generate(input: AiPlanningProviderInput): Promise<AiPlanningResult>;
}

export type AiPlanningProviderSuggestion = AiMealSuggestion;
