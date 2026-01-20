import { Link, createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { Building2, Loader2, Save, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "../../../../../convex/_generated/api";
import { AuthHeader } from "~/components/layout/auth-header";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Spinner } from "~/components/ui/spinner";

export const Route = createFileRoute("/org/$slug/admin/settings")({
  component: OrgAdminSettings,
});

function OrgAdminSettings() {
  const { slug } = Route.useParams();

  const org = useQuery(api.orgs.directory.getOrgBySlug, { slug });
  const membership = useQuery(
    api.orgs.membership.getMembership,
    org ? { orgId: org._id } : "skip"
  );
  const lumaConfig = useQuery(
    api.orgs.admin.getLumaConfig,
    org && membership?.role === "admin" ? { orgId: org._id } : "skip"
  );

  // Form state
  const [lumaCalendarUrl, setLumaCalendarUrl] = useState("");
  const [lumaApiKey, setLumaApiKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const updateLumaConfig = useMutation(api.orgs.admin.updateLumaConfig);

  // Populate form when config loads
  useEffect(() => {
    if (lumaConfig) {
      setLumaCalendarUrl(lumaConfig.lumaCalendarUrl || "");
      setLumaApiKey(lumaConfig.lumaApiKey || "");
    }
  }, [lumaConfig]);

  // Loading state
  if (org === undefined || membership === undefined) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-12 bg-slate-100 rounded-xl w-1/3" />
              <div className="h-64 bg-slate-100 rounded-xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Org not found
  if (org === null) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-lg mx-auto text-center py-12">
            <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Building2 className="size-8 text-slate-400" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-4">
              Organization Not Found
            </h1>
            <Button asChild>
              <Link to="/">Go Home</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Not an admin
  if (!membership || membership.role !== "admin") {
    return (
      <div className="min-h-screen bg-slate-50">
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-lg mx-auto text-center py-12">
            <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Shield className="size-8 text-slate-400" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-4">
              Admin Access Required
            </h1>
            <Button asChild>
              <Link to="/org/$slug" params={{ slug }}>
                Back to Organization
              </Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await updateLumaConfig({
        orgId: org._id,
        lumaCalendarUrl: lumaCalendarUrl.trim() || undefined,
        lumaApiKey: lumaApiKey.trim() || undefined,
      });
      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AuthHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
              <Link
                to="/org/$slug"
                params={{ slug }}
                className="hover:text-slate-700 transition-colors"
              >
                {org.name}
              </Link>
              <span>/</span>
              <Link
                to="/org/$slug/admin"
                params={{ slug }}
                className="hover:text-slate-700 transition-colors"
              >
                Admin
              </Link>
              <span>/</span>
              <span className="text-slate-700">Settings</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            <p className="text-slate-600 mt-1">
              Configure integrations and organization settings
            </p>
          </div>

          {/* Lu.ma Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Lu.ma Events Integration</CardTitle>
              <CardDescription>
                Connect your lu.ma calendar to display events on your organization page
              </CardDescription>
            </CardHeader>
            <CardContent>
              {lumaConfig === undefined ? (
                <div className="flex justify-center py-8">
                  <Spinner className="size-6" />
                </div>
              ) : (
                <form onSubmit={handleSave} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="lumaCalendarUrl">Lu.ma Calendar URL</Label>
                    <Input
                      id="lumaCalendarUrl"
                      type="url"
                      placeholder="https://lu.ma/your-calendar"
                      value={lumaCalendarUrl}
                      onChange={(e) => setLumaCalendarUrl(e.target.value)}
                    />
                    <p className="text-sm text-slate-500">
                      Your public lu.ma calendar URL (e.g., https://lu.ma/your-calendar)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lumaApiKey">Lu.ma API Key</Label>
                    <Input
                      id="lumaApiKey"
                      type="password"
                      placeholder="Enter API key"
                      value={lumaApiKey}
                      onChange={(e) => setLumaApiKey(e.target.value)}
                    />
                    <p className="text-sm text-slate-500">
                      Optional - enables event display on dashboard. Requires Luma Plus subscription.
                    </p>
                  </div>

                  {lumaConfig.eventsLastSynced && (
                    <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm">
                      <span className="text-slate-600">Last synced: </span>
                      <span className="text-foreground">
                        {new Date(lumaConfig.eventsLastSynced).toLocaleString()}
                      </span>
                    </div>
                  )}

                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="size-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
