import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SpicePreferenceInput } from "@/features/household/spice-preference-input";

type TasteProfileFieldsProps = {
  defaultName?: string | null;
};

export function TasteProfileFields({ defaultName }: TasteProfileFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Label className="space-y-2 text-sm font-medium">
          <span>Your profile name</span>
          <Input
            name="profileName"
            defaultValue={defaultName ?? ""}
            placeholder="Jon"
            required
          />
        </Label>
        <Label className="space-y-2 text-sm font-medium">
          <span>Initials</span>
          <Input name="initials" placeholder="JB" maxLength={4} />
        </Label>
        <Label className="space-y-2 text-sm font-medium">
          <span>Color</span>
          <Input name="color" type="color" defaultValue="#1f7668" />
        </Label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Label className="space-y-2 text-sm font-medium">
          <span>Likes</span>
          <Input name="likes" placeholder="chicken, rice bowls, lemon" />
        </Label>
        <Label className="space-y-2 text-sm font-medium">
          <span>Dislikes</span>
          <Input name="dislikes" placeholder="raw onion, mushrooms" />
        </Label>
        <Label className="space-y-2 text-sm font-medium">
          <span>Allergies</span>
          <Input name="allergies" placeholder="tree nuts" />
        </Label>
        <Label className="space-y-2 text-sm font-medium">
          <span>Dietary preferences</span>
          <Input name="dietaryPreferences" placeholder="vegetarian, gluten-free" />
        </Label>
        <Label className="space-y-2 text-sm font-medium">
          <span>Favorite cuisines</span>
          <Input name="favoriteCuisines" placeholder="Italian, Thai, Mexican" />
        </Label>
        <Label className="space-y-2 text-sm font-medium">
          <span>Spice preference</span>
          <SpicePreferenceInput
            name="preferredSpiceLevel"
            defaultValue={2}
          />
        </Label>
      </div>

      <Label className="space-y-2 text-sm font-medium">
        <span>Notes</span>
        <Textarea
          name="notes"
          placeholder="Any meal planning context that helps the household plan around you."
        />
      </Label>
    </div>
  );
}
