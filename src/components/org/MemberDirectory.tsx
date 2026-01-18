import { useQuery } from "convex/react";
import { MapPin, Shield, Users } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

interface MemberDirectoryProps {
  orgId: Id<"organizations">;
}

export function MemberDirectory({ orgId }: MemberDirectoryProps) {
  const members = useQuery(api.orgs.directory.getVisibleMembers, { orgId });

  if (members === undefined) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-6 bg-slate-100 rounded w-3/4 mb-2" />
            <div className="h-4 bg-slate-100 rounded w-1/2 mb-4" />
            <div className="flex gap-2">
              <div className="h-5 bg-slate-100 rounded w-16" />
              <div className="h-5 bg-slate-100 rounded w-16" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <Users className="size-6 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-2">
          No visible members yet
        </h3>
        <p className="text-slate-500 text-sm">
          Members can choose to appear in the directory when they join.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {members.map((member: Member) => (
        <MemberCard key={member.membershipId} member={member} />
      ))}
    </div>
  );
}

type Member = {
  membershipId: Id<"orgMemberships">;
  userId: string;
  role: "admin" | "member";
  profile: {
    name: string;
    headline?: string;
    skills: string[];
    location?: string;
  };
};

interface MemberCardProps {
  member: Member;
}

function MemberCard({ member }: MemberCardProps) {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-medium text-slate-900">{member.profile.name}</h3>
          {member.profile.headline && (
            <p className="text-sm text-slate-600 line-clamp-2">
              {member.profile.headline}
            </p>
          )}
        </div>
        {member.role === "admin" && (
          <Badge variant="secondary" className="shrink-0 ml-2">
            <Shield className="size-3 mr-1" />
            Admin
          </Badge>
        )}
      </div>

      {member.profile.location && (
        <div className="flex items-center gap-1 text-sm text-slate-500 mb-3">
          <MapPin className="size-3" />
          {member.profile.location}
        </div>
      )}

      {member.profile.skills.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {member.profile.skills.map((skill) => (
            <Badge key={skill} variant="outline" className="text-xs">
              {skill}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  );
}
