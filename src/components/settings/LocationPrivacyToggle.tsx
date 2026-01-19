import { useMutation, useQuery } from "convex/react";
import { MapPin } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";
import { Spinner } from "~/components/ui/spinner";

export function LocationPrivacyToggle() {
  const locationPrivacy = useQuery(api.profiles.getLocationPrivacy);
  const updateLocationPrivacy = useMutation(api.profiles.updateLocationPrivacy);

  const handleToggle = async (checked: boolean) => {
    try {
      await updateLocationPrivacy({ locationDiscoverable: checked });
      toast.success(
        checked
          ? "Location-based suggestions enabled"
          : "Location-based suggestions disabled"
      );
    } catch (error) {
      toast.error("Failed to update location privacy setting");
      console.error("Failed to update location privacy:", error);
    }
  };

  // Show loading state
  if (locationPrivacy === undefined) {
    return (
      <Card className="max-w-2xl">
        <CardContent className="flex items-center justify-center py-8">
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  const locationDiscoverable = locationPrivacy?.locationDiscoverable ?? false;

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="size-5" />
          Location Privacy
        </CardTitle>
        <CardDescription>
          Control how your location is used for organization suggestions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Location Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label
              htmlFor="location-discoverable"
              className="flex items-center gap-2 text-base font-medium"
            >
              <MapPin className="size-4 text-primary" />
              Location-Based Suggestions
            </Label>
            <p className="text-sm text-slate-500">
              Get organization suggestions based on your city. Your exact
              location is never shared with organizations.
            </p>
          </div>
          <Switch
            id="location-discoverable"
            checked={locationDiscoverable}
            onCheckedChange={handleToggle}
          />
        </div>

        {/* Informational note */}
        <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
          <p>
            When enabled, we match you with organizations in your city. Only
            city-level location is used - your exact address is never stored or
            shared.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
