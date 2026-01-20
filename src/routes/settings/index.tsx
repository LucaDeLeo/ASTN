import { createFileRoute } from "@tanstack/react-router";
import { AttendancePrivacyForm } from "~/components/settings/AttendancePrivacyForm";
import { EventNotificationPrefsForm } from "~/components/settings/EventNotificationPrefsForm";
import { LocationPrivacyToggle } from "~/components/settings/LocationPrivacyToggle";
import { NotificationPrefsForm } from "~/components/settings/NotificationPrefsForm";

export const Route = createFileRoute("/settings/")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <main className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-slate-500 mt-1">
          Manage your notification preferences and account settings
        </p>
      </div>

      <NotificationPrefsForm />
      <EventNotificationPrefsForm />
      <LocationPrivacyToggle />
      <AttendancePrivacyForm />
    </main>
  );
}
