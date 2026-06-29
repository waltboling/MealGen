# Release and Deployment

## Current Strategy

Use GitHub for source control, Supabase for auth/database, and Vercel for hosting.

The app supports two modes:

- `APP_MODE=demo` for local demo testing only.
- `APP_MODE=supabase` for real users, real auth, and deployed environments.

Demo mode must never be used in production. The app rejects demo mode when production environment flags are set.

## GitHub Setup

1. Create a private GitHub repository.
2. Add the repository as this project's remote:

```bash
git remote add origin git@github.com:<your-user>/<your-repo>.git
```

3. Push the initial branch:

```bash
git push -u origin main
```

Do not commit `.env`, `.env.local`, `.env.production`, build output, or local caches.

## Supabase Setup

1. Create a Supabase project in your Supabase account.
2. Copy the project URL and anon key into `.env.local` for local real-mode testing.
3. Copy the database connection strings into `DATABASE_URL` and `DIRECT_URL`.
4. Set:

```env
APP_MODE="supabase"
APP_ENV="local"
```

5. Run migrations:

```bash
pnpm prisma:migrate
```

6. Start the app and test signup, onboarding, invitations, and household scoping.

## Vercel Setup

1. Import the GitHub repo into Vercel.
2. Add production environment variables from `.env.production.example`.
3. Set these production safety flags:

```env
APP_MODE="supabase"
APP_ENV="production"
NEXT_PUBLIC_APP_ENV="production"
```

4. Deploy first to the Vercel preview URL.
5. Test signup, login, onboarding, recipe creation, meal planning, grocery generation, and logout.
6. Connect a custom domain after the preview deployment is verified.

## Domain

If a domain is already owned, connect it in Vercel's domain settings and follow the DNS instructions. If not, buy a domain through Vercel or another registrar, then connect it after the first production deployment works.

## Pre-Release Checklist

- Rotate any API keys that may have been pasted into local files, chats, screenshots, or tools.
- Confirm `.env.local` and `.env` are ignored by Git.
- Run `pnpm typecheck`.
- Run `pnpm test`.
- Run `pnpm lint`.
- Run `pnpm build`.
- Test real Supabase signup and onboarding.
- Test invite-code onboarding with a second user.
- Confirm users cannot access another household's data.
