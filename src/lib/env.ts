export type AppMode = "demo" | "supabase";

const PLACEHOLDER_PATTERNS = ["replace-with", "your-", "example"];

function isPlaceholder(value: string | undefined) {
  if (!value) {
    return true;
  }

  const normalized = value.toLowerCase();
  return PLACEHOLDER_PATTERNS.some((pattern) => normalized.includes(pattern));
}

export function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value || isPlaceholder(value)) {
    throw new Error(`Missing or placeholder environment variable: ${name}`);
  }

  return value;
}

export function isProductionDeployment() {
  return (
    process.env.APP_ENV === "production" ||
    process.env.NEXT_PUBLIC_APP_ENV === "production" ||
    process.env.VERCEL_ENV === "production"
  );
}

export function getAppMode(): AppMode {
  const configuredMode = process.env.APP_MODE?.toLowerCase();

  if (configuredMode === "demo" || configuredMode === "supabase") {
    return configuredMode;
  }

  if (configuredMode) {
    throw new Error("APP_MODE must be either demo or supabase.");
  }

  return isPlaceholder(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    ? "demo"
    : "supabase";
}

export function isDemoMode() {
  return getAppMode() === "demo";
}

export function validateEnvironment() {
  const mode = getAppMode();

  if (isProductionDeployment() && mode === "demo") {
    throw new Error(
      "Demo mode is disabled for production deployments. Set APP_MODE=supabase and configure Supabase environment variables."
    );
  }

  if (mode === "supabase") {
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    getRequiredEnv("DATABASE_URL");
    getRequiredEnv("DIRECT_URL");
  }

  return { mode };
}

export function getEnvironmentStatus() {
  try {
    const { mode } = validateEnvironment();
    return { ok: true as const, mode, error: null };
  } catch (error) {
    return {
      ok: false as const,
      mode: null,
      error: error instanceof Error ? error.message : "Invalid environment."
    };
  }
}
