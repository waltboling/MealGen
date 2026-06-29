import { ExternalLink, Star, Trash2 } from "lucide-react";
import {
  createFavoriteSourceAction,
  deleteFavoriteSourceAction,
  updateFavoriteSourceAction
} from "@/features/favorite-sources/actions";
import { FavoriteSourceService } from "@/features/favorite-sources/service";
import type {
  FavoriteSource,
  FavoriteSourceType
} from "@/features/favorite-sources/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { PageHeader } from "@/components/layout/page-header";
import { getCurrentHouseholdOrRedirect } from "@/lib/auth/current-household";
import { canManageHousehold } from "@/lib/auth/permissions";

type FavoriteSourcesPageProps = {
  searchParams: Promise<{
    status?: string;
  }>;
};

const favoriteSourceService = new FavoriteSourceService();
const sourceTypes: Array<{ value: FavoriteSourceType; label: string }> = [
  { value: "WEBSITE", label: "Website" },
  { value: "CREATOR", label: "Creator" },
  { value: "BLOG", label: "Blog" },
  { value: "CHANNEL", label: "YouTube / Channel" },
  { value: "PUBLICATION", label: "Publication" }
];

function StatusMessage({ status }: { status?: string }) {
  const messages: Record<string, string> = {
    created: "Favorite source added.",
    updated: "Favorite source saved.",
    deleted: "Favorite source removed."
  };

  if (!status) {
    return null;
  }

  return (
    <div className="rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
      {messages[status] ?? "Saved."}
    </div>
  );
}

function typeLabel(type: FavoriteSourceType) {
  return sourceTypes.find((sourceType) => sourceType.value === type)?.label ?? type;
}

function SourceFields({
  source,
  disabled
}: {
  source?: FavoriteSource;
  disabled: boolean;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[160px_1fr_1fr_120px]">
      <Label className="space-y-2 text-sm font-medium">
        <span>Type</span>
        <select
          name="type"
          defaultValue={source?.type ?? "WEBSITE"}
          disabled={disabled}
          className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
        >
          {sourceTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </Label>
      <Label className="space-y-2 text-sm font-medium">
        <span>Display name</span>
        <Input
          name="name"
          defaultValue={source?.name ?? ""}
          placeholder="Smitten Kitchen"
          disabled={disabled}
          required
        />
      </Label>
      <Label className="space-y-2 text-sm font-medium">
        <span>URL or domain</span>
        <Input
          name="url"
          defaultValue={source?.url ?? ""}
          placeholder="example.com"
          disabled={disabled}
        />
      </Label>
      <Label className="space-y-2 text-sm font-medium">
        <span>Boost</span>
        <Input
          name="rankingBoost"
          type="number"
          min="1"
          max="100"
          defaultValue={source?.rankingBoost ?? 10}
          disabled={disabled}
        />
      </Label>
      <Label className="space-y-2 text-sm font-medium lg:col-span-4">
        <span>Notes</span>
        <Textarea
          name="notes"
          defaultValue={source?.notes ?? ""}
          placeholder="Why this source tends to work for the household"
          disabled={disabled}
        />
      </Label>
    </div>
  );
}

export default async function FavoriteSourcesPage({
  searchParams
}: FavoriteSourcesPageProps) {
  const params = await searchParams;
  const context = await getCurrentHouseholdOrRedirect();
  const [sources] = await Promise.all([
    favoriteSourceService.listFavoriteSources(context)
  ]);
  const canManage = canManageHousehold(context);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <PageHeader
          title="Favorite Sources"
          description="Prioritize the sites, creators, blogs, and channels your household trusts."
        />
        <Badge variant={canManage ? "default" : "outline"} className="w-fit">
          <Star className="mr-1 size-3" />
          {canManage ? "Editable" : "View only"}
        </Badge>
      </div>

      <StatusMessage status={params.status} />

      <Card>
        <CardHeader>
          <CardTitle>Add source</CardTitle>
          <CardDescription>
            Use a display name, source URL/domain when available, and a boost
            value. Higher boosts move matching recipe results upward.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createFavoriteSourceAction} className="space-y-4">
            <SourceFields disabled={!canManage} />
            <Button type="submit" disabled={!canManage}>
              <Star className="size-4" />
              Add Favorite Source
            </Button>
          </form>
        </CardContent>
      </Card>

      {sources.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No favorite sources yet</CardTitle>
            <CardDescription>
              Add sources here, then search recipes to see matching results
              highlighted and boosted.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-4">
          {sources.map((source) => (
            <Card key={source.id}>
              <CardHeader>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle>{source.name}</CardTitle>
                      <Badge variant="outline">{typeLabel(source.type)}</Badge>
                      <Badge>+{source.rankingBoost} boost</Badge>
                    </div>
                    <CardDescription className="mt-2">
                      {source.url ? (
                        <a
                          href={
                            source.url.startsWith("http")
                              ? source.url
                              : `https://${source.url}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-primary"
                        >
                          {source.url}
                          <ExternalLink className="size-3" />
                        </a>
                      ) : (
                        "Matched by source or creator name when provider data includes it."
                      )}
                    </CardDescription>
                  </div>
                  <form action={deleteFavoriteSourceAction}>
                    <input type="hidden" name="id" value={source.id} />
                    <Button
                      type="submit"
                      variant="outline"
                      disabled={!canManage}
                    >
                      <Trash2 className="size-4" />
                      Remove
                    </Button>
                  </form>
                </div>
              </CardHeader>
              <CardContent>
                <form action={updateFavoriteSourceAction} className="space-y-4">
                  <input type="hidden" name="id" value={source.id} />
                  <SourceFields source={source} disabled={!canManage} />
                  <Button type="submit" variant="outline" disabled={!canManage}>
                    Save Source
                  </Button>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
