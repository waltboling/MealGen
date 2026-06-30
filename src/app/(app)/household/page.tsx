import type React from "react";
import Link from "next/link";
import { ShieldCheck, UserRoundPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChiliPepperIcon } from "@/components/ui/chili-pepper-icon";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CopyInviteLinkButton } from "@/components/household/copy-invite-link-button";
import { PageHeader } from "@/components/layout/page-header";
import {
  createMealProfileAction,
  deactivateMealProfileAction,
  inviteHouseholdUserAction,
  updateHouseholdAction,
  updateMealProfileAction,
  updateMembershipRoleAction
} from "@/features/household/actions";
import { HouseholdService } from "@/features/household/service";
import { MemberActionPanel } from "@/features/household/member-action-panel";
import { SpicePreferenceInput } from "@/features/household/spice-preference-input";
import { SubmitButton } from "@/features/household/submit-button";
import type { HouseholdProfile } from "@/features/household/types";
import { getCurrentHouseholdOrRedirect } from "@/lib/auth/current-household";
import { canEditProfile, canManageHousehold } from "@/lib/auth/permissions";

type HouseholdSettingsPageProps = {
  searchParams: Promise<{
    status?: string;
  }>;
};

const householdService = new HouseholdService();

const roleOptions = ["ADMIN", "MEMBER"] as const;

function listValue(items: string[]) {
  return items.join(", ");
}

function profileTypeLabel(profileType: string) {
  return profileType
    .toLowerCase()
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeSpiceLevel(value?: number | null) {
  return Math.min(Math.max(value ?? 2, 0), 5);
}

function SpicePreferenceDisplay({ value }: { value?: number | null }) {
  const level = value == null ? 0 : normalizeSpiceLevel(value);

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((item) => (
        <ChiliPepperIcon
          key={item}
          className={
            item <= level
              ? "size-4 fill-red-600 text-red-700"
              : "size-4 fill-transparent text-muted-foreground/45"
          }
        />
      ))}
      <span className="ml-1 text-muted-foreground">
        {level === 0 ? "No spice" : `${level} / 5`}
      </span>
    </span>
  );
}

function StatusMessage({ status }: { status?: string }) {
  if (!status) {
    return null;
  }

  const messages: Record<string, string> = {
    "household-updated": "Household settings saved.",
    "invite-created": "Invitation added. Copy the invite link below and send it directly.",
    "role-updated": "Access role updated.",
    "profile-created": "Meal profile added.",
    "profile-updated": "Meal profile saved.",
    "profile-deactivated": "Meal profile deactivated."
  };

  return (
    <div className="rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
      {messages[status] ?? "Saved."}
    </div>
  );
}

function Field({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Label className="space-y-2 text-sm font-medium">
      <span>{label}</span>
      {children}
    </Label>
  );
}

function ProfileForm({
  profile,
  disabled,
  mode
}: {
  profile?: HouseholdProfile;
  disabled: boolean;
  mode: "create" | "edit" | "guest";
}) {
  const isGuest = mode === "guest" || profile?.profileType === "GUEST";
  const action = mode === "create" || mode === "guest"
    ? createMealProfileAction
    : updateMealProfileAction;
  const submitLabel = mode === "edit"
    ? "Save Profile"
    : isGuest
      ? "Add Guest"
      : "Save member";

  return (
    <form action={action} className="space-y-4">
      {profile ? <input type="hidden" name="id" value={profile.id} /> : null}
      <input
        type="hidden"
        name="profileType"
        value={isGuest ? "GUEST" : profile?.profileType ?? "MANAGED"}
      />
      <input
        type="hidden"
        name="active"
        value={profile?.active === false ? "false" : "true"}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Name">
          <Input
            name="name"
            defaultValue={profile?.name}
            placeholder={isGuest ? "Dinner guest" : "Household profile"}
            disabled={disabled}
            required
          />
        </Field>
        <Field label="Initials">
          <Input
            name="initials"
            defaultValue={profile?.initials ?? ""}
            placeholder="JB"
            disabled={disabled}
            maxLength={4}
          />
        </Field>
        <Field label="Color">
          <Input
            name="color"
            type="color"
            defaultValue={profile?.color ?? "#1f7668"}
            disabled={disabled}
          />
        </Field>
      </div>

      {isGuest ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Active from">
            <Input
              name="activeFrom"
              type="date"
              defaultValue={profile?.activeFrom ?? ""}
              disabled={disabled}
            />
          </Field>
          <Field label="Active until">
            <Input
              name="activeUntil"
              type="date"
              defaultValue={profile?.activeUntil ?? ""}
              disabled={disabled}
            />
          </Field>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Likes">
          <Input
            name="likes"
            defaultValue={listValue(profile?.likes ?? [])}
            placeholder="pasta, chicken, salads"
            disabled={disabled}
          />
        </Field>
        <Field label="Dislikes">
          <Input
            name="dislikes"
            defaultValue={listValue(profile?.dislikes ?? [])}
            placeholder="raw onion, mushrooms"
            disabled={disabled}
          />
        </Field>
        <Field label="Allergies">
          <Input
            name="allergies"
            defaultValue={listValue(profile?.allergies ?? [])}
            placeholder="tree nuts"
            disabled={disabled}
          />
        </Field>
        <Field label="Dietary preferences">
          <Input
            name="dietaryPreferences"
            defaultValue={listValue(profile?.dietaryPreferences ?? [])}
            placeholder="vegetarian, gluten-free"
            disabled={disabled}
          />
        </Field>
        <Field label="Favorite cuisines">
          <Input
            name="favoriteCuisines"
            defaultValue={listValue(profile?.favoriteCuisines ?? [])}
            placeholder="Italian, Thai"
            disabled={disabled}
          />
        </Field>
        <Field label="Spice preference">
          <SpicePreferenceInput
            name="preferredSpiceLevel"
            defaultValue={normalizeSpiceLevel(profile?.preferredSpiceLevel)}
            disabled={disabled}
          />
        </Field>
      </div>

      <Field label="Notes">
        <Textarea
          name="notes"
          defaultValue={profile?.notes ?? ""}
          placeholder="Useful planning context"
          disabled={disabled}
        />
      </Field>

      <div className="flex flex-wrap gap-2">
        <SubmitButton disabled={disabled}>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}

function DietarySummary({ profile }: { profile: HouseholdProfile }) {
  const summary = [
    ...profile.allergies.map((item) => `Allergy: ${item}`),
    ...profile.dietaryPreferences,
    ...profile.dislikes.map((item) => `Avoids ${item}`)
  ];

  if (summary.length === 0) {
    return <span className="text-muted-foreground">No dietary notes</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {summary.slice(0, 5).map((item) => (
        <Badge key={item} variant="outline">
          {item}
        </Badge>
      ))}
    </div>
  );
}

function ProfileValueList({
  label,
  values
}: {
  label: string;
  values: string[];
}) {
  return (
    <div>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      {values.length > 0 ? (
        <div className="mt-1 flex flex-wrap gap-1.5">
          {values.map((value) => (
            <Badge key={value} variant="outline">
              {value}
            </Badge>
          ))}
        </div>
      ) : (
        <div className="mt-1 text-sm text-muted-foreground">None listed</div>
      )}
    </div>
  );
}

function ProfileReadOnly({ profile }: { profile: HouseholdProfile }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ProfileValueList label="Likes" values={profile.likes} />
      <ProfileValueList label="Dislikes" values={profile.dislikes} />
      <ProfileValueList label="Allergies" values={profile.allergies} />
      <ProfileValueList
        label="Dietary preferences"
        values={profile.dietaryPreferences}
      />
      <ProfileValueList
        label="Favorite cuisines"
        values={profile.favoriteCuisines}
      />
      <div>
        <div className="text-xs font-medium text-muted-foreground">
          Spice preference
        </div>
        <div className="mt-1 text-sm">
          <SpicePreferenceDisplay value={profile.preferredSpiceLevel} />
        </div>
      </div>
      <div className="md:col-span-2">
        <div className="text-xs font-medium text-muted-foreground">Notes</div>
        <div className="mt-1 text-sm text-muted-foreground">
          {profile.notes || "No notes yet"}
        </div>
      </div>
    </div>
  );
}

function MemberProfileCard({
  profile,
  accountLabel,
  editable,
  canDeactivate,
  isSelf
}: {
  profile: HouseholdProfile;
  accountLabel: string;
  editable: boolean;
  canDeactivate: boolean;
  isSelf: boolean;
}) {
  const isManaged = profile.profileType === "MANAGED";
  const isGuest = profile.profileType === "GUEST";

  return (
    <Card id={isSelf ? "my-profile" : undefined}>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="flex size-12 shrink-0 items-center justify-center rounded-md text-sm font-semibold text-white"
              style={{ backgroundColor: profile.color ?? "#1f7668" }}
            >
              {profile.initials ?? profile.name.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0">
              <CardTitle className="truncate">{profile.name}</CardTitle>
              <CardDescription>{accountLabel}</CardDescription>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="outline">{profileTypeLabel(profile.profileType)}</Badge>
                <Badge variant={profile.active ? "secondary" : "outline"}>
                  {profile.active ? "Active" : "Inactive"}
                </Badge>
                {isSelf ? <Badge variant="outline">You</Badge> : null}
                {editable ? (
                  <Badge variant="outline">Editable</Badge>
                ) : (
                  <Badge variant="outline">View only</Badge>
                )}
              </div>
            </div>
          </div>
          <DietarySummary profile={profile} />
        </div>
      </CardHeader>
      <CardContent>
        <details className="rounded-md border border-border bg-background">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium">
            Full meal profile
          </summary>
          <div className="space-y-4 border-t border-border p-4">
            {editable ? (
              <ProfileForm
                profile={profile}
                disabled={false}
                mode={isGuest ? "guest" : "edit"}
              />
            ) : (
              <ProfileReadOnly profile={profile} />
            )}
            {canDeactivate && profile.active ? (
              <form action={deactivateMealProfileAction}>
                <input type="hidden" name="id" value={profile.id} />
                <SubmitButton variant="outline">Deactivate Profile</SubmitButton>
              </form>
            ) : null}
            {!editable && !isManaged ? (
              <p className="text-sm text-muted-foreground">
                Full members manage their own meal profiles from their account.
              </p>
            ) : null}
          </div>
        </details>
      </CardContent>
    </Card>
  );
}

export default async function HouseholdSettingsPage({
  searchParams
}: HouseholdSettingsPageProps) {
  const params = await searchParams;
  const context = await getCurrentHouseholdOrRedirect();
  const settings = await householdService.getSettings(context);
  const isAdmin = canManageHousehold(context);
  const accountByProfileId = new Map(
    settings.accountUsers
      .filter((user) => user.linkedProfileId)
      .map((user) => [user.linkedProfileId, user])
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <PageHeader
          title="Household Settings"
          description="Manage app access separately from the people and guests who participate in meal plans."
        />
        <Badge variant={isAdmin ? "default" : "outline"} className="w-fit">
          <ShieldCheck className="mr-1 size-3" />
          {isAdmin ? "Admin" : "Member"}
        </Badge>
      </div>

      <StatusMessage status={params.status} />

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
          <CardDescription>
            The household is the shared planning space for recipes, meal plans, and grocery lists.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateHouseholdAction} className="grid gap-4 md:grid-cols-[1fr_160px_auto] md:items-end">
            <Field label="Household name">
              <Input
                name="name"
                defaultValue={settings.household.name}
                disabled={!isAdmin}
                required
              />
            </Field>
            <Field label="Default servings">
              <Input
                name="defaultServings"
                type="number"
                min="1"
                max="24"
                defaultValue={settings.household.defaultServings}
                disabled={!isAdmin}
              />
            </Field>
            <SubmitButton disabled={!isAdmin}>Save Overview</SubmitButton>
          </form>
          {!isAdmin ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Members can view household settings and edit their own linked meal profile.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold">Members</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Each card shows the planning profile. Open a card for the full meal
            profile and editing controls when you have permission.
          </p>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {settings.profiles.map((profile) => {
            const account = accountByProfileId.get(profile.id);
            const editable = canEditProfile(context, profile);
            const isSelf = profile.linkedUserId === context.userId;
            const accountLabel = account
              ? `${account.email} · ${account.role}`
              : profile.profileType === "MANAGED"
                ? "Managed member · no app login"
                : "Guest · no app login";

            return (
              <MemberProfileCard
                key={profile.id}
                profile={profile}
                accountLabel={accountLabel}
                editable={editable}
                canDeactivate={isAdmin && !profile.linkedUserId}
                isSelf={isSelf}
              />
            );
          })}
        </div>

        {isAdmin ? (
          <MemberActionPanel
            managedMemberForm={<ProfileForm disabled={false} mode="create" />}
            inviteForm={
              <form action={inviteHouseholdUserAction} className="grid gap-3 md:grid-cols-[1fr_160px_auto] md:items-end">
                <Field label="Invite by email">
                  <Input
                    name="email"
                    type="email"
                    placeholder="person@example.com"
                    required
                  />
                </Field>
                <Label className="space-y-2 text-sm font-medium">
                  <span>Role</span>
                  <select
                    name="role"
                    defaultValue="MEMBER"
                    className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
                  >
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </Label>
                <SubmitButton>
                  <UserRoundPlus className="size-4" />
                  Create invite
                </SubmitButton>
              </form>
            }
          />
        ) : null}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Permissions</CardTitle>
          <CardDescription>
            Admins manage app access, household settings, managed profiles, guests, and roles.
            Members can plan meals and edit their own linked profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 text-sm">
          <p className="text-muted-foreground">
            Server actions enforce these permissions, so read-only controls cannot be bypassed by submitting forms manually.
          </p>

          {isAdmin ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">App access</h3>
                <p className="mt-1 text-muted-foreground">
                  These are the people who can sign in to this household.
                </p>
              </div>
              <div className="space-y-3">
                {settings.accountUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex flex-col gap-3 rounded-md border border-border p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <div className="font-medium">{user.name ?? user.email}</div>
                      <div className="text-muted-foreground">{user.email}</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="outline">{user.status}</Badge>
                        <Badge variant="outline">
                          {user.linkedProfileId
                            ? "Linked profile"
                            : "No linked profile"}
                        </Badge>
                      </div>
                    </div>
                    <form action={updateMembershipRoleAction} className="flex gap-2">
                      <input type="hidden" name="userId" value={user.id} />
                      <select
                        name="role"
                        defaultValue={user.role}
                        className="h-10 rounded-md border border-input bg-card px-3 text-sm"
                      >
                        {roleOptions.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                      <SubmitButton variant="outline">Update</SubmitButton>
                    </form>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Invitations</h3>
                <p className="text-muted-foreground">
                  MealGen creates invite links and codes here. Automatic invite
                  emails are not connected yet, so copy the link and send it
                  directly.
                </p>
                {settings.invitations.length > 0 ? (
                  <div className="space-y-2">
                    {settings.invitations.map((invite) => (
                      <div
                        key={invite.id}
                        className="flex flex-col gap-3 rounded-md border border-border p-3 text-muted-foreground sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="space-y-2">
                          <div className="font-medium text-foreground">
                            {invite.email}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline">{invite.role}</Badge>
                            <Badge variant="outline">{invite.status}</Badge>
                            {invite.token ? (
                              <Badge variant="outline">Code: {invite.token}</Badge>
                            ) : null}
                          </div>
                        </div>
                        {invite.token ? (
                          <div className="flex flex-wrap gap-2">
                            <CopyInviteLinkButton inviteCode={invite.token} />
                            <Button asChild variant="outline" size="sm">
                              <Link
                                href={`/signup?inviteCode=${encodeURIComponent(invite.token)}`}
                              >
                                Open link
                              </Link>
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    No pending invitations.
                  </p>
                )}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
