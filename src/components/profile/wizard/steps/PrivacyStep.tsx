import { Shield } from "lucide-react";
import { Card } from "~/components/ui/card";

export function PrivacyStep() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          Privacy Settings
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Control who can see your profile information.
        </p>
      </div>

      <Card className="p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="size-12 rounded-full bg-green-100 flex items-center justify-center">
            <Shield className="size-6 text-green-600" />
          </div>
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-2">Coming Soon</h3>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          You will be able to set visibility levels for each section of your
          profile, choose a default privacy setting, and hide your profile from
          specific organizations.
        </p>
      </Card>
    </div>
  );
}
