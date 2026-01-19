import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bell, Globe, Mail } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";

// Common IANA timezones grouped by region
const TIMEZONE_GROUPS = [
  {
    label: "Americas",
    timezones: [
      { value: "America/New_York", label: "New York (EST/EDT)" },
      { value: "America/Chicago", label: "Chicago (CST/CDT)" },
      { value: "America/Denver", label: "Denver (MST/MDT)" },
      { value: "America/Los_Angeles", label: "Los Angeles (PST/PDT)" },
      { value: "America/Sao_Paulo", label: "Sao Paulo (BRT)" },
      { value: "America/Argentina/Buenos_Aires", label: "Buenos Aires (ART)" },
    ],
  },
  {
    label: "Europe",
    timezones: [
      { value: "Europe/London", label: "London (GMT/BST)" },
      { value: "Europe/Paris", label: "Paris (CET/CEST)" },
      { value: "Europe/Berlin", label: "Berlin (CET/CEST)" },
      { value: "Europe/Amsterdam", label: "Amsterdam (CET/CEST)" },
    ],
  },
  {
    label: "Asia",
    timezones: [
      { value: "Asia/Tokyo", label: "Tokyo (JST)" },
      { value: "Asia/Shanghai", label: "Shanghai (CST)" },
      { value: "Asia/Singapore", label: "Singapore (SGT)" },
      { value: "Asia/Kolkata", label: "Kolkata (IST)" },
      { value: "Asia/Dubai", label: "Dubai (GST)" },
    ],
  },
  {
    label: "Pacific",
    timezones: [
      { value: "Australia/Sydney", label: "Sydney (AEST/AEDT)" },
      { value: "Australia/Melbourne", label: "Melbourne (AEST/AEDT)" },
      { value: "Pacific/Auckland", label: "Auckland (NZST/NZDT)" },
    ],
  },
];

export function NotificationPrefsForm() {
  const preferences = useQuery(api.profiles.getNotificationPreferences);
  const updatePreferences = useMutation(api.profiles.updateNotificationPreferences);

  // Local state for form
  const [matchAlerts, setMatchAlerts] = useState(false);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [timezone, setTimezone] = useState(() => {
    // Auto-detect browser timezone
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return "America/New_York";
    }
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sync local state with loaded preferences
  useEffect(() => {
    if (preferences) {
      setMatchAlerts(preferences.matchAlerts.enabled);
      setWeeklyDigest(preferences.weeklyDigest.enabled);
      setTimezone(preferences.timezone);
      setHasChanges(false);
    }
  }, [preferences]);

  // Track changes
  const handleMatchAlertsChange = (checked: boolean) => {
    setMatchAlerts(checked);
    setHasChanges(true);
  };

  const handleWeeklyDigestChange = (checked: boolean) => {
    setWeeklyDigest(checked);
    setHasChanges(true);
  };

  const handleTimezoneChange = (value: string) => {
    setTimezone(value);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePreferences({
        matchAlertsEnabled: matchAlerts,
        weeklyDigestEnabled: weeklyDigest,
        timezone,
      });
      setHasChanges(false);
      toast.success("Notification preferences saved");
    } catch (error) {
      toast.error("Failed to save preferences");
      console.error("Failed to save preferences:", error);
    } finally {
      setSaving(false);
    }
  };

  // Show loading state
  if (preferences === undefined) {
    return (
      <Card className="max-w-2xl">
        <CardContent className="flex items-center justify-center py-8">
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  // First-time setup prompt
  const isFirstTime = preferences === null;

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="size-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          {isFirstTime
            ? "Set up your notification preferences to stay informed about new opportunities that match your profile."
            : "Control how and when you receive updates about opportunities."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Match Alerts Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="match-alerts" className="flex items-center gap-2 text-base font-medium">
              <Bell className="size-4 text-primary" />
              Match Alerts
            </Label>
            <p className="text-sm text-slate-500">
              Get notified when we find great-fit opportunities for you
            </p>
          </div>
          <Switch
            id="match-alerts"
            checked={matchAlerts}
            onCheckedChange={handleMatchAlertsChange}
          />
        </div>

        {/* Weekly Digest Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="weekly-digest" className="flex items-center gap-2 text-base font-medium">
              <Mail className="size-4 text-primary" />
              Weekly Digest
            </Label>
            <p className="text-sm text-slate-500">
              Receive a weekly summary of new matches and profile tips
            </p>
          </div>
          <Switch
            id="weekly-digest"
            checked={weeklyDigest}
            onCheckedChange={handleWeeklyDigestChange}
          />
        </div>

        {/* Timezone Select */}
        <div className="space-y-2">
          <Label htmlFor="timezone" className="flex items-center gap-2 text-base font-medium">
            <Globe className="size-4 text-primary" />
            Timezone
          </Label>
          <p className="text-sm text-slate-500 mb-2">
            We&apos;ll send notifications at appropriate times for your location
          </p>
          <Select value={timezone} onValueChange={handleTimezoneChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select your timezone" />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONE_GROUPS.map((group) => (
                <SelectGroup key={group.label}>
                  <SelectLabel>{group.label}</SelectLabel>
                  {group.timezones.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
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
            ) : isFirstTime ? (
              "Enable Notifications"
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
