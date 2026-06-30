"use client";

import { useMemo, useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

type CopyInviteLinkButtonProps = {
  inviteCode: string;
};

export function CopyInviteLinkButton({ inviteCode }: CopyInviteLinkButtonProps) {
  const [copied, setCopied] = useState(false);
  const invitePath = `/signup?inviteCode=${encodeURIComponent(inviteCode)}`;
  const inviteLink = useMemo(() => {
    if (typeof window === "undefined") {
      return invitePath;
    }

    return `${window.location.origin}${invitePath}`;
  }, [invitePath]);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={async () => {
        await navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      }}
    >
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      {copied ? "Copied" : "Copy link"}
    </Button>
  );
}
