"use client";

import { useState, type ReactNode } from "react";
import { UserRoundPlus, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";

type MemberAction = "managed" | "invite";

type MemberActionPanelProps = {
  managedMemberForm: ReactNode;
  inviteForm: ReactNode;
};

export function MemberActionPanel({
  managedMemberForm,
  inviteForm
}: MemberActionPanelProps) {
  const [selectedAction, setSelectedAction] = useState<MemberAction | null>(
    null
  );

  return (
    <div className="rounded-lg border border-dashed border-border bg-card p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          variant={selectedAction === "managed" ? "default" : "outline"}
          onClick={() => setSelectedAction("managed")}
          className="justify-start"
        >
          <UsersRound className="size-4" />
          Add managed member
        </Button>
        <Button
          type="button"
          variant={selectedAction === "invite" ? "default" : "outline"}
          onClick={() => setSelectedAction("invite")}
          className="justify-start"
        >
          <UserRoundPlus className="size-4" />
          Invite full member
        </Button>
      </div>

      <div className="mt-5">
        {selectedAction === "managed" ? (
          <div className="space-y-3">
            <div>
              <h3 className="font-medium">Add managed member</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                For children or household members who do not need their own app login.
              </p>
            </div>
            {managedMemberForm}
          </div>
        ) : selectedAction === "invite" ? (
          <div className="space-y-3">
            <div>
              <h3 className="font-medium">Invite full member</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Full members accept an invite and manage their own meal profile.
              </p>
            </div>
            {inviteForm}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Choose whether this person should have their own app login or be a
            managed household member.
          </p>
        )}
      </div>
    </div>
  );
}
