import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { Building2, CalendarCheck, Eye } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";

export function AttendancePrivacyForm() {
  const privacyDefaults = useQuery(
    api.attendance.queries.getAttendancePrivacyDefaults
  );
  const updatePrivacy = useMutation(
    api.attendance.mutations.updateAttendancePrivacy
  );

  const [showOnProfile, setShowOnProfile] = useState(true);
  const [showToOtherOrgs, setShowToOtherOrgs] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sync local state with loaded preferences
  useEffect(() => {
    if (privacyDefaults) {
      setShowOnProfile(privacyDefaults.showOnProfile);
      setShowToOtherOrgs(privacyDefaults.showToOtherOrgs);
      setHasChanges(false);
    }
  }, [privacyDefaults]);

  const handleShowOnProfileChange = (checked: boolean) => {
    setShowOnProfile(checked);
    setHasChanges(true);
    // If hiding from profile, also hide from other orgs
    if (!checked) {
      setShowToOtherOrgs(false);
    }
  };

  const handleShowToOtherOrgsChange = (checked: boolean) => {
    setShowToOtherOrgs(checked);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePrivacy({
        showOnProfile,
        showToOtherOrgs,
        updateExisting: true, // Apply to existing records too
      });
      setHasChanges(false);
      toast.success("Attendance privacy settings saved");
    } catch (error) {
      toast.error("Failed to save attendance privacy settings");
      console.error("Failed to update attendance privacy:", error);
    } finally {
      setSaving(false);
    }
  };

  // Show loading state
  if (privacyDefaults === undefined) {
    return (
      <Card className="max-w-2xl">
        <CardContent className="flex items-center justify-center py-8">
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarCheck className="size-5" />
          Attendance Privacy
        </CardTitle>
        <CardDescription>
          Control who can see your event attendance history
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Show on Profile Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label
              htmlFor="show-on-profile"
              className="flex items-center gap-2 text-base font-medium"
            >
              <Eye className="size-4 text-primary" />
              Show on Profile
            </Label>
            <p className="text-sm text-slate-500">
              Other users can see your attendance history on your profile
            </p>
          </div>
          <Switch
            id="show-on-profile"
            checked={showOnProfile}
            onCheckedChange={handleShowOnProfileChange}
          />
        </div>

        {/* Share with Other Orgs Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label
              htmlFor="show-to-other-orgs"
              className="flex items-center gap-2 text-base font-medium"
            >
              <Building2 className="size-4 text-primary" />
              Share with Other Organizations
            </Label>
            <p className="text-sm text-slate-500">
              Organizations you are not a member of can see your attendance
            </p>
          </div>
          <Switch
            id="show-to-other-orgs"
            checked={showToOtherOrgs}
            onCheckedChange={handleShowToOtherOrgsChange}
            disabled={!showOnProfile}
          />
        </div>

        {/* Informational note */}
        <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
          <p>
            The hosting organization always sees attendance at their events,
            regardless of these settings. This helps orgs understand event
            engagement.
          </p>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="w-full sm:w-auto"
          >
            {saving ? (
              <>
                <Spinner className="size-4 mr-2" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
          {hasChanges && (
            <p className="text-xs text-slate-500 mt-2">
              Changes will apply to all your attendance records
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
