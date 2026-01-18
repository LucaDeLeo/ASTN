import { MessageSquare } from "lucide-react";
import { Card } from "~/components/ui/card";

export function EnrichmentStep() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          Profile Enrichment
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Have a conversation with our AI career coach to enhance your profile.
        </p>
      </div>

      <Card className="p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="size-12 rounded-full bg-blue-100 flex items-center justify-center">
            <MessageSquare className="size-6 text-blue-600" />
          </div>
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-2">Coming Soon</h3>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          Our AI-powered career coach will help you articulate your experience
          and goals. Through a friendly conversation, we will extract relevant
          details to enhance your profile and improve opportunity matching.
        </p>
      </Card>
    </div>
  );
}
