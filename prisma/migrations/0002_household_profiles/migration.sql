CREATE TYPE "HouseholdAccessStatus" AS ENUM ('ACTIVE', 'INVITED', 'DISABLED');
CREATE TYPE "HouseholdProfileType" AS ENUM ('USER_LINKED', 'MANAGED', 'GUEST');
CREATE TYPE "HouseholdInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED');

ALTER TYPE "HouseholdRole" ADD VALUE IF NOT EXISTS 'ADMIN';

ALTER TABLE "HouseholdMembership"
  ADD COLUMN "status" "HouseholdAccessStatus" NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE "HouseholdMember"
  ADD COLUMN "linkedUserId" UUID,
  ADD COLUMN "profileType" "HouseholdProfileType" NOT NULL DEFAULT 'MANAGED',
  ADD COLUMN "color" TEXT,
  ADD COLUMN "initials" TEXT,
  ADD COLUMN "temporary" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "activeFrom" DATE,
  ADD COLUMN "activeUntil" DATE,
  ADD COLUMN "likes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "dislikes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "allergies" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "dietaryPreferences" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "favoriteCuisines" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "notes" TEXT;

CREATE INDEX "HouseholdMember_linkedUserId_idx" ON "HouseholdMember"("linkedUserId");

ALTER TABLE "HouseholdMember"
  ADD CONSTRAINT "HouseholdMember_linkedUserId_fkey"
  FOREIGN KEY ("linkedUserId") REFERENCES "UserProfile"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "HouseholdInvitation" (
  "id" UUID NOT NULL,
  "householdId" UUID NOT NULL,
  "email" TEXT NOT NULL,
  "role" "HouseholdRole" NOT NULL DEFAULT 'MEMBER',
  "status" "HouseholdInvitationStatus" NOT NULL DEFAULT 'PENDING',
  "token" TEXT,
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HouseholdInvitation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HouseholdInvitation_householdId_idx" ON "HouseholdInvitation"("householdId");
CREATE INDEX "HouseholdInvitation_email_idx" ON "HouseholdInvitation"("email");

ALTER TABLE "HouseholdInvitation"
  ADD CONSTRAINT "HouseholdInvitation_householdId_fkey"
  FOREIGN KEY ("householdId") REFERENCES "Household"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
