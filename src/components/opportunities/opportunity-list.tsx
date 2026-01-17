import { OpportunityCard } from "./opportunity-card";
import { Empty } from "~/components/ui/empty";
import { Spinner } from "~/components/ui/spinner";
import type { Id } from "../../../convex/_generated/dataModel";

type Opportunity = {
  _id: Id<"opportunities">;
  title: string;
  organization: string;
  organizationLogoUrl?: string;
  location: string;
  isRemote: boolean;
  roleType: string;
  salaryRange?: string;
  deadline?: number;
  lastVerified: number;
};

export function OpportunityList({
  opportunities,
  isLoading,
}: {
  opportunities?: Opportunity[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Spinner className="w-6 h-6" />
        <p className="text-sm text-slate-500 font-mono">Loading opportunities...</p>
      </div>
    );
  }

  if (!opportunities || opportunities.length === 0) {
    return (
      <Empty className="py-16">
        <Empty.Icon />
        <Empty.Title>No opportunities found</Empty.Title>
        <Empty.Description>
          Try adjusting your filters or check back later.
        </Empty.Description>
      </Empty>
    );
  }

  return (
    <div className="space-y-4">
      {opportunities.map((opportunity, index) => (
        <div
          key={opportunity._id}
          className="animate-in fade-in slide-in-from-bottom-2 duration-300"
          style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
        >
          <OpportunityCard opportunity={opportunity} index={index} />
        </div>
      ))}
    </div>
  );
}
