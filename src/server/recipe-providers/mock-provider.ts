import type {
  ImportedRecipeCandidate,
  RecipeLookupInput,
  RecipeProvider,
  RecipeSearchInput,
  RecipeSearchResult
} from "@/server/recipe-providers/types";

const demoRecipes: ImportedRecipeCandidate[] = [
  {
    providerId: "demo",
    externalId: "lemon-herb-salmon",
    title: "Lemon Herb Salmon with Couscous",
    description:
      "A bright sheet-pan style dinner with flaky salmon, herbs, and quick couscous.",
    imageUrl:
      "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=900&q=80",
    sourceName: "Demo Kitchen",
    sourceUrl: "https://example.com/recipes/lemon-herb-salmon",
    authorName: "Mara Ellis",
    prepMinutes: 15,
    cookMinutes: 20,
    servings: 4,
    cuisines: ["Mediterranean"],
    diets: ["Pescatarian"],
    tags: ["dinner", "fish", "quick"],
    ingredients: [
      {
        displayText: "4 salmon fillets",
        name: "salmon fillets",
        quantity: 4,
        unit: null
      },
      {
        displayText: "2 tbsp olive oil",
        name: "olive oil",
        quantity: 2,
        unit: "tbsp"
      },
      {
        displayText: "1 lemon, sliced",
        name: "lemon",
        quantity: 1,
        unit: null
      },
      {
        displayText: "1 cup couscous",
        name: "couscous",
        quantity: 1,
        unit: "cup"
      },
      {
        displayText: "2 cups baby spinach",
        name: "baby spinach",
        quantity: 2,
        unit: "cups"
      }
    ],
    instructions: [
      "Season salmon with olive oil, salt, pepper, and herbs.",
      "Roast the salmon with lemon slices until just cooked through.",
      "Prepare couscous according to the package directions.",
      "Fold spinach into the warm couscous and serve with salmon."
    ]
  },
  {
    providerId: "demo",
    externalId: "black-bean-tacos",
    title: "Smoky Black Bean Tacos",
    description:
      "A fast vegetarian taco night built around pantry beans, lime, and crunchy toppings.",
    imageUrl:
      "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=900&q=80",
    sourceName: "Demo Kitchen",
    sourceUrl: "https://example.com/recipes/smoky-black-bean-tacos",
    authorName: "Nico Rivera",
    prepMinutes: 10,
    cookMinutes: 15,
    servings: 4,
    cuisines: ["Mexican"],
    diets: ["Vegetarian"],
    tags: ["tacos", "weeknight", "beans"],
    ingredients: [
      {
        displayText: "2 cans black beans, drained",
        name: "black beans",
        quantity: 2,
        unit: "cans"
      },
      {
        displayText: "1 tsp smoked paprika",
        name: "smoked paprika",
        quantity: 1,
        unit: "tsp"
      },
      {
        displayText: "8 corn tortillas",
        name: "corn tortillas",
        quantity: 8,
        unit: null
      },
      {
        displayText: "2 cups shredded cabbage",
        name: "shredded cabbage",
        quantity: 2,
        unit: "cups"
      },
      {
        displayText: "1 lime",
        name: "lime",
        quantity: 1,
        unit: null
      }
    ],
    instructions: [
      "Warm beans with smoked paprika, salt, and a splash of water.",
      "Char or warm tortillas until pliable.",
      "Fill tortillas with beans and cabbage.",
      "Finish with lime juice and any favorite taco toppings."
    ]
  },
  {
    providerId: "demo",
    externalId: "ginger-chicken-rice-bowls",
    title: "Ginger Chicken Rice Bowls",
    description:
      "Tender chicken, crisp vegetables, and a gingery sauce over rice.",
    imageUrl:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80",
    sourceName: "Demo Kitchen",
    sourceUrl: "https://example.com/recipes/ginger-chicken-rice-bowls",
    authorName: "Ari Chen",
    prepMinutes: 20,
    cookMinutes: 20,
    servings: 4,
    cuisines: ["Asian"],
    diets: ["Dairy-Free"],
    tags: ["chicken", "rice bowl", "meal prep"],
    ingredients: [
      {
        displayText: "1.5 lb boneless chicken thighs",
        name: "boneless chicken thighs",
        quantity: 1.5,
        unit: "lb"
      },
      {
        displayText: "2 tbsp soy sauce",
        name: "soy sauce",
        quantity: 2,
        unit: "tbsp"
      },
      {
        displayText: "1 tbsp grated ginger",
        name: "ginger",
        quantity: 1,
        unit: "tbsp"
      },
      {
        displayText: "2 cups cooked rice",
        name: "cooked rice",
        quantity: 2,
        unit: "cups"
      },
      {
        displayText: "3 cups mixed vegetables",
        name: "mixed vegetables",
        quantity: 3,
        unit: "cups"
      }
    ],
    instructions: [
      "Cook chicken in a skillet until browned and cooked through.",
      "Stir in soy sauce, ginger, and a little water to glaze.",
      "Steam or saute vegetables until crisp-tender.",
      "Serve chicken and vegetables over rice."
    ]
  },
  {
    providerId: "demo",
    externalId: "creamy-tomato-pasta",
    title: "Creamy Tomato Basil Pasta",
    description:
      "A cozy pasta with tomato, basil, and a small splash of cream.",
    imageUrl:
      "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=900&q=80",
    sourceName: "Demo Kitchen",
    sourceUrl: "https://example.com/recipes/creamy-tomato-basil-pasta",
    authorName: "Nico Rivera",
    prepMinutes: 10,
    cookMinutes: 25,
    servings: 6,
    cuisines: ["Italian"],
    diets: ["Vegetarian"],
    tags: ["pasta", "comfort", "family"],
    ingredients: [
      {
        displayText: "1 lb short pasta",
        name: "short pasta",
        quantity: 1,
        unit: "lb"
      },
      {
        displayText: "2 cups tomato sauce",
        name: "tomato sauce",
        quantity: 2,
        unit: "cups"
      },
      {
        displayText: "1/2 cup heavy cream",
        name: "heavy cream",
        quantity: 0.5,
        unit: "cup"
      },
      {
        displayText: "1/2 cup grated parmesan",
        name: "parmesan",
        quantity: 0.5,
        unit: "cup"
      },
      {
        displayText: "1 bunch basil",
        name: "basil",
        quantity: 1,
        unit: "bunch"
      }
    ],
    instructions: [
      "Boil pasta in salted water until al dente.",
      "Simmer tomato sauce while pasta cooks.",
      "Stir cream and parmesan into the sauce.",
      "Toss pasta with sauce and finish with basil."
    ]
  }
];

function includesAny(values: string[], selected: string[] | undefined) {
  if (!selected || selected.length === 0) {
    return true;
  }

  const normalizedValues = values.map((value) => value.toLowerCase());
  return selected.some((value) => normalizedValues.includes(value.toLowerCase()));
}

function matchesQuery(recipe: ImportedRecipeCandidate, query: string | undefined) {
  const normalizedQuery = query?.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return [
    recipe.title,
    recipe.description,
    recipe.sourceName,
    ...recipe.tags,
    ...recipe.cuisines,
    ...recipe.diets
  ]
    .filter(Boolean)
    .some((value) => value?.toLowerCase().includes(normalizedQuery));
}

function toSearchResult(recipe: ImportedRecipeCandidate): RecipeSearchResult {
  return {
    providerId: recipe.providerId,
    externalId: recipe.externalId,
    title: recipe.title,
    imageUrl: recipe.imageUrl,
    sourceName: recipe.sourceName,
    sourceUrl: recipe.sourceUrl,
    authorName: recipe.authorName,
    prepMinutes: recipe.prepMinutes,
    cookMinutes: recipe.cookMinutes,
    servings: recipe.servings,
    cuisines: recipe.cuisines,
    diets: recipe.diets,
    tags: recipe.tags
  };
}

export class MockRecipeProvider implements RecipeProvider {
  id = "demo";
  name = "Demo Recipes";

  async search(input: RecipeSearchInput) {
    return demoRecipes
      .filter((recipe) => matchesQuery(recipe, input.query))
      .filter((recipe) => includesAny(recipe.cuisines, input.cuisines))
      .filter((recipe) => includesAny(recipe.diets, input.diets))
      .filter((recipe) => {
        if (!input.maxCookTimeMinutes) {
          return true;
        }

        return (
          (recipe.prepMinutes ?? 0) + (recipe.cookMinutes ?? 0) <=
          input.maxCookTimeMinutes
        );
      })
      .filter((recipe) => {
        if (!input.servings) {
          return true;
        }

        return (recipe.servings ?? 0) >= input.servings;
      })
      .map(toSearchResult);
  }

  async getRecipe(input: RecipeLookupInput) {
    const recipe = demoRecipes.find((item) => item.externalId === input.externalId);

    if (!recipe) {
      throw new Error("Recipe provider could not find that recipe.");
    }

    return {
      ...recipe,
      rawPayload: recipe
    };
  }
}
