import type {
  GroceryNormalizationInput,
  GroceryNormalizationResult,
  GroceryNormalizer
} from "./types.ts";

const SYNONYMS = new Map<string, GroceryNormalizationResult>([
  ["bell peppers", { normalizedName: "bell pepper", category: "Produce" }],
  ["broccoli florets", { normalizedName: "broccoli", category: "Produce" }],
  ["brussels sprouts", { normalizedName: "brussels sprouts", category: "Produce" }],
  ["cauliflower florets", { normalizedName: "cauliflower", category: "Produce" }],
  ["chicken breasts", { normalizedName: "chicken breast", category: "Meat & Seafood" }],
  ["scallions", { normalizedName: "green onion", category: "Produce" }],
  ["green onions", { normalizedName: "green onion", category: "Produce" }],
  ["clove garlic", { normalizedName: "garlic", category: "Produce" }],
  ["cloves garlic", { normalizedName: "garlic", category: "Produce" }],
  ["garlic cloves", { normalizedName: "garlic", category: "Produce" }],
  ["juice of lemon", { normalizedName: "lemon", category: "Produce" }],
  ["juice of lime", { normalizedName: "lime", category: "Produce" }],
  ["lemon juice", { normalizedName: "lemon", category: "Produce" }],
  ["lime juice", { normalizedName: "lime", category: "Produce" }],
  ["lemon zest", { normalizedName: "lemon", category: "Produce" }],
  ["lime zest", { normalizedName: "lime", category: "Produce" }],
  ["lemon", { normalizedName: "lemon", category: "Produce" }],
  ["lemons", { normalizedName: "lemon", category: "Produce" }],
  ["lime", { normalizedName: "lime", category: "Produce" }],
  ["limes", { normalizedName: "lime", category: "Produce" }],
  ["cherry tomatoes", { normalizedName: "tomato", category: "Produce" }],
  ["tomatoes", { normalizedName: "tomato", category: "Produce" }],
  ["cooked rice", { normalizedName: "rice", category: "Pantry" }],
  ["steamed rice", { normalizedName: "rice", category: "Pantry" }],
  ["white rice", { normalizedName: "rice", category: "Pantry" }],
  ["jasmine rice", { normalizedName: "rice", category: "Pantry" }],
  ["rigatoni", { normalizedName: "rigatoni", category: "Pantry" }],
  [
    "boneless chicken thighs",
    { normalizedName: "chicken thighs", category: "Meat & Seafood" }
  ],
  ["cucumber", { normalizedName: "cucumber", category: "Produce" }]
]);

function categorize(name: string) {
  if (/\b(chicken|beef|pork|salmon|shrimp|turkey|sausage)\b/.test(name)) {
    return "Meat & Seafood";
  }

  if (/\b(rice|pasta|rigatoni|flour|sugar|oil|vinegar|beans)\b/.test(name)) {
    return "Pantry";
  }

  if (/\b(milk|cream|cheese|yogurt|butter|parmesan)\b/.test(name)) {
    return "Dairy";
  }

  if (/\b(tomato|garlic|lemon|cucumber|onion|pepper|basil|herb)\b/.test(name)) {
    return "Produce";
  }

  return "Other";
}

const prepWords = [
  "about",
  "baby",
  "boneless",
  "chopped",
  "cooked",
  "diced",
  "drained",
  "dry",
  "fresh",
  "grated",
  "halved",
  "julienned",
  "large",
  "medium",
  "minced",
  "optional",
  "peeled",
  "pitted",
  "quartered",
  "rinsed",
  "roasted",
  "skinless",
  "sliced",
  "small",
  "steamed",
  "thinly",
  "uncooked",
  "zested",
  "juiced"
];

const prepWordPattern = new RegExp(`\\b(${prepWords.join("|")})\\b`, "g");

function compact(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function stripParentheticals(value: string) {
  return value.replace(/\([^)]*\)/g, " ");
}

function stripCommaNotes(value: string) {
  return value.split(",")[0] ?? value;
}

function stripLeadingAmounts(value: string) {
  return value
    .replace(
      /^\s*(\d+([./]\d+)?|\d+\s+\d+\/\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+/,
      ""
    )
    .replace(
      /^\s*(cups?|cupfuls?|tbsp|tablespoons?|tsp|teaspoons?|oz|ounces?|lb|lbs|pounds?|g|grams?|kg|kilograms?|cloves?|stalks?|cans?|bunches?|pieces?)\s+(of\s+)?/,
      ""
    );
}

function normalizeJuiceOrZest(value: string) {
  if (/\b(juice|zest).*\b(of\s+)?\d*\s*(small|medium|large)?\s*lemons?\b/.test(value)) {
    return "lemon";
  }

  if (/\b(juice|zest).*\b(of\s+)?\d*\s*(small|medium|large)?\s*limes?\b/.test(value)) {
    return "lime";
  }

  return value;
}

function groceryNameFromIngredient(name: string) {
  const lower = name.trim().toLowerCase();
  const citrus = normalizeJuiceOrZest(lower);

  if (citrus !== lower) {
    return citrus;
  }

  return compact(
    stripLeadingAmounts(stripCommaNotes(stripParentheticals(lower)))
      .replace(/\bfor garnish\b/g, " ")
      .replace(/\bto taste\b/g, " ")
      .replace(/\bgreen parts only\b/g, " ")
      .replace(/\bthinly sliced\b/g, " ")
      .replace(prepWordPattern, " ")
      .replace(/\bflorets?\b/g, " ")
      .replace(/\bbreasts?\b/g, "breast")
      .replace(/\bthighs?\b/g, "thighs")
  );
}

function knownGroceryResult(name: string): GroceryNormalizationResult | null {
  const produceFamilies: Array<[RegExp, string]> = [
    [/\bgreen onions?\b|\bscallions?\b/, "green onion"],
    [/\bbrussels sprouts?\b/, "brussels sprouts"],
    [/\bbell peppers?\b/, "bell pepper"],
    [/\bbroccoli\b/, "broccoli"],
    [/\bcauliflower\b/, "cauliflower"],
    [/\bspinach\b/, "spinach"],
    [/\bcarrots?\b/, "carrot"],
    [/\bcelery\b/, "celery"],
    [/\bparsley\b/, "parsley"],
    [/\bbasil\b/, "basil"],
    [/\bginger\b/, "ginger"],
    [/\btomatoes?\b/, "tomato"],
    [/\bcucumbers?\b/, "cucumber"],
    [/\bgarlic\b/, "garlic"],
    [/\blemons?\b/, "lemon"],
    [/\blimes?\b/, "lime"]
  ];
  const proteins: Array<[RegExp, string]> = [
    [/\bchicken breast\b/, "chicken breast"],
    [/\bchicken thighs?\b/, "chicken thighs"],
    [/\bground beef\b|\blean ground beef\b/, "ground beef"],
    [/\bground pork\b/, "ground pork"],
    [/\bpork loin\b/, "pork loin"],
    [/\bsalmon\b/, "salmon"],
    [/\bshrimp\b/, "shrimp"]
  ];

  for (const [pattern, normalizedName] of produceFamilies) {
    if (pattern.test(name)) {
      return { normalizedName, category: "Produce" };
    }
  }

  for (const [pattern, normalizedName] of proteins) {
    if (pattern.test(name)) {
      return { normalizedName, category: "Meat & Seafood" };
    }
  }

  return null;
}

export class BasicGroceryNormalizer implements GroceryNormalizer {
  normalize(input: GroceryNormalizationInput): GroceryNormalizationResult {
    const cleaned = groceryNameFromIngredient(input.name);
    const synonym = SYNONYMS.get(cleaned);

    if (synonym) {
      return synonym;
    }

    const knownResult = knownGroceryResult(cleaned);

    if (knownResult) {
      return knownResult;
    }

    return {
      normalizedName: cleaned,
      category: categorize(cleaned)
    };
  }
}
