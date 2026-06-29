export type HouseholdRole = "ADMIN" | "OWNER" | "ADULT" | "MEMBER" | "GUEST";

export type HouseholdAccessStatus = "ACTIVE" | "INVITED" | "DISABLED";

export type HouseholdProfileType = "USER_LINKED" | "MANAGED" | "GUEST";

export type HouseholdInvitationStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REVOKED"
  | "EXPIRED";

export type HouseholdMemberOption = {
  id: string;
  name: string;
  active: boolean;
  linkedUserId: string | null;
  profileType: HouseholdProfileType;
  temporary: boolean;
  activeFrom: string | null;
  activeUntil: string | null;
  color: string | null;
  initials: string | null;
};

export type HouseholdProfile = HouseholdMemberOption & {
  avatarUrl: string | null;
  preferredSpiceLevel: number | null;
  likes: string[];
  dislikes: string[];
  allergies: string[];
  dietaryPreferences: string[];
  favoriteCuisines: string[];
  notes: string | null;
};

export type HouseholdAccountUser = {
  id: string;
  email: string;
  name: string | null;
  role: HouseholdRole;
  status: HouseholdAccessStatus;
  linkedProfileId: string | null;
};

export type HouseholdInvitation = {
  id: string;
  email: string;
  role: HouseholdRole;
  status: HouseholdInvitationStatus;
  token: string | null;
};

export type HouseholdSettings = {
  household: {
    id: string;
    name: string;
    defaultServings: number;
  };
  accountUsers: HouseholdAccountUser[];
  invitations: HouseholdInvitation[];
  profiles: HouseholdProfile[];
};
