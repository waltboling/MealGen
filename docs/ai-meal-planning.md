# Prompt-Driven Meal Planning

The app now has a central `Plan with AI` flow at `/plan-with-ai`.

## Architecture

The UI gathers a primary freeform prompt plus optional structured controls. The server validates that request with Zod, adds household profile context and saved recipes, then calls an AI planning provider through `AiPlanningProvider`.

Providers return structured meal suggestions, not free text. The app validates provider output before rendering review cards.

Current providers:

- `MockAiPlanningProvider`: deterministic local suggestions for demo mode and development without API keys.
- `OpenAiPlanningProvider`: server-side OpenAI-compatible provider selected when `OPENAI_API_KEY` is present.

```env
OPENAI_API_KEY="your-key"
OPENAI_MEAL_PLANNER_MODEL="gpt-4.1-mini"
```

If no OpenAI key is present, the mock provider remains active. If OpenAI is configured but returns malformed output or an API error, the page shows a retryable error instead of adding meals.

## Acceptance Flow

Suggestions are review-only until the user accepts one. Accepting a suggestion:

1. Creates a saved recipe in My Recipes.
2. Adds that recipe to the selected week/day with selected participants.
3. Regenerates the grocery list for that week.

This keeps AI-generated meals compatible with the weekly planner, Meals by Person, recipe detail pages, and grocery list generation.

## Safety Notes

- Prompts and provider calls stay server-side.
- Provider output is validated with Zod.
- Nutrition values are treated as estimates.
- The app does not invent external source attribution for generated meals.
- Nothing is added to the plan without review and explicit acceptance.

## Future Discover Mode TODO

Add a separate Discover mode later:

- Vertical recipe feed.
- Swipe or scroll through recipes.
- Like/double-tap to save.
- Favorite source weighting.
- Liked recipes influence future recommendations.
