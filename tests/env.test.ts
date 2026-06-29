import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  getAppMode,
  getEnvironmentStatus,
  isProductionDeployment,
  validateEnvironment
} from "../src/lib/env.ts";

type TestEnv = Record<string, string | undefined>;

const ORIGINAL_ENV: TestEnv = { ...process.env };

function resetEnv(overrides: TestEnv = {}) {
  process.env = { ...ORIGINAL_ENV, ...overrides } as NodeJS.ProcessEnv;
}

afterEach(() => {
  process.env = { ...ORIGINAL_ENV } as NodeJS.ProcessEnv;
});

describe("environment hardening", () => {
  it("uses explicit local demo mode without requiring Supabase secrets", () => {
    resetEnv({
      APP_MODE: "demo",
      APP_ENV: "local",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "replace-with-your-supabase-anon-key",
      DATABASE_URL: undefined,
      DIRECT_URL: undefined
    });

    assert.equal(getAppMode(), "demo");
    assert.deepEqual(validateEnvironment(), { mode: "demo" });
  });

  it("falls back to demo mode only for placeholder local Supabase values", () => {
    resetEnv({
      APP_MODE: undefined,
      APP_ENV: "local",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "replace-with-your-supabase-anon-key"
    });

    assert.equal(getAppMode(), "demo");
  });

  it("rejects demo mode in production", () => {
    resetEnv({
      APP_MODE: "demo",
      APP_ENV: "production"
    });

    assert.equal(isProductionDeployment(), true);
    assert.throws(
      () => validateEnvironment(),
      /Demo mode is disabled for production deployments/
    );
  });

  it("requires real Supabase and database values in Supabase mode", () => {
    resetEnv({
      APP_MODE: "supabase",
      APP_ENV: "local",
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "replace-with-your-supabase-anon-key",
      DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
      DIRECT_URL: "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
    });

    assert.throws(
      () => validateEnvironment(),
      /Missing or placeholder environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY/
    );
  });

  it("returns a readable status object for invalid config", () => {
    resetEnv({
      APP_MODE: "maybe",
      APP_ENV: "local"
    });

    assert.deepEqual(getEnvironmentStatus(), {
      ok: false,
      mode: null,
      error: "APP_MODE must be either demo or supabase."
    });
  });
});
