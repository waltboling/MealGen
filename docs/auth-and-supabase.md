# Auth and Supabase Setup

This app has two runtime modes:

- `APP_MODE=demo`: local-only demo mode. Login and signup open the seeded demo household and do not create Supabase users.
- `APP_MODE=supabase`: real auth and database mode. Login/signup use Supabase Auth, and server actions read/write data scoped to the authenticated user's household.

Demo mode is intentionally disabled when `APP_ENV=production`, `NEXT_PUBLIC_APP_ENV=production`, or `VERCEL_ENV=production`.

## Environment Variables

Local demo development can use:

```env
APP_MODE="demo"
APP_ENV="local"
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
DIRECT_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:54321"
NEXT_PUBLIC_SUPABASE_ANON_KEY="replace-with-your-supabase-anon-key"
```

Real Supabase mode requires:

```env
APP_MODE="supabase"
APP_ENV="local"
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-real-anon-key"
```

Production deployments should set:

```env
APP_MODE="supabase"
APP_ENV="production"
NEXT_PUBLIC_APP_ENV="production"
```

Keep database connection strings server-only. Do not expose `DATABASE_URL`, `DIRECT_URL`, or service-role keys to browser code.

## Local Supabase Setup

1. Create or start a Supabase project.
2. Copy the project URL and anon key into `.env.local`.
3. Set `APP_MODE="supabase"`.
4. Set `DATABASE_URL` and `DIRECT_URL` to the Supabase Postgres connection strings.
5. Run Prisma migrations and seed data if desired:

```bash
pnpm prisma:migrate
pnpm seed
```

## Auth Flow Checks

Demo mode:

1. Set `APP_MODE="demo"` and `APP_ENV="local"`.
2. Open `/login`.
3. Submit any valid email/password shape.
4. Confirm you land on `/dashboard` and see the demo household.
5. Log out and confirm you return to `/login`.

Real Supabase mode:

1. Set `APP_MODE="supabase"` with real Supabase and database values.
2. Open `/signup`.
3. Create a user with a real email/password.
4. Confirm Supabase Auth contains the user.
5. Confirm the app creates a `UserProfile`, `Household`, `HouseholdMembership`, and linked `HouseholdMember`.
6. Log out.
7. Log back in at `/login`.
8. Confirm protected app routes redirect to `/login` when logged out.

## Authorization Boundaries

Current server-side protection:

- App routes require an authenticated Supabase session outside demo mode.
- The current household is resolved from the authenticated Supabase user ID.
- Recipe, meal plan, grocery list, and household repository queries are scoped by `householdId`.
- Household management actions require an admin/owner role.
- Members can edit only their own linked profile unless they are household admins.

Manual cross-household test:

1. Create user A and user B in real Supabase mode.
2. Let each user create their own household.
3. As user A, copy a recipe, meal, grocery item, or household profile ID from user B's household.
4. Attempt to open or mutate that ID while logged in as user A.
5. Expected result: reads return not found, updates/deletes do not affect user B data, and protected actions either no-op safely or show an authorization error.

## Recommended Supabase RLS

The app currently accesses application tables through server-side Prisma queries scoped by household. If you expose these tables through Supabase client APIs, enable Row Level Security and add policies based on active household membership.

Example helper pattern:

```sql
create or replace function public.is_household_member(target_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public."HouseholdMembership" membership
    where membership."householdId" = target_household_id
      and membership."userId" = auth.uid()
      and membership."status" = 'ACTIVE'
  );
$$;
```

Example table policies:

```sql
alter table public."Household" enable row level security;
alter table public."HouseholdMembership" enable row level security;
alter table public."HouseholdMember" enable row level security;
alter table public."Recipe" enable row level security;
alter table public."MealPlan" enable row level security;
alter table public."GroceryList" enable row level security;

create policy household_member_select_household
on public."Household"
for select
using (public.is_household_member(id));

create policy household_member_select_recipes
on public."Recipe"
for select
using (public.is_household_member("householdId"));

create policy household_member_select_meal_plans
on public."MealPlan"
for select
using (public.is_household_member("householdId"));

create policy household_member_select_grocery_lists
on public."GroceryList"
for select
using (public.is_household_member("householdId"));
```

Add matching insert/update/delete policies for household members, and restrict admin-only mutations with a helper that checks `role in ('ADMIN', 'OWNER')`. Child tables such as recipe ingredients, recipe notes, meal participants, and grocery items should enforce access through their parent recipe, meal plan, or grocery list.
