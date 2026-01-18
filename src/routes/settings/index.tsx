import { createFileRoute } from "@tanstack/react-router";
import { NotificationPrefsForm } from "~/components/settings/NotificationPrefsForm";

export const Route = createFileRoute("/settings/")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">
          Manage your notification preferences and account settings
        </p>
      </div>

      <NotificationPrefsForm />
    </main>
  );
}
