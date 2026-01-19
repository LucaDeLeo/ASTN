import { Link } from "@tanstack/react-router";
import { Calendar, Users } from "lucide-react";
import { format } from "date-fns";
import type { Doc } from "../../../convex/_generated/dataModel";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

const statusColors = {
  planning: "bg-slate-100 text-slate-700",
  active: "bg-green-100 text-green-700",
  completed: "bg-blue-100 text-blue-700",
  archived: "bg-slate-50 text-slate-500",
};

const typeLabels = {
  reading_group: "Reading Group",
  fellowship: "Fellowship",
  mentorship: "Mentorship",
  cohort: "Cohort",
  workshop_series: "Workshop Series",
  custom: "Custom",
};

interface ProgramCardProps {
  program: Doc<"programs"> & { participantCount: number };
  slug: string;
}

export function ProgramCard({ program, slug }: ProgramCardProps) {
  return (
    <Link
      to="/org/$slug/admin/programs/$programId"
      params={{ slug, programId: program._id }}
    >
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="text-lg truncate">{program.name}</CardTitle>
              <p className="text-sm text-slate-500">{typeLabels[program.type]}</p>
            </div>
            <Badge className={statusColors[program.status]}>
              {program.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {program.description && (
            <p className="text-sm text-slate-600 line-clamp-2 mb-3">
              {program.description}
            </p>
          )}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-slate-500">
              <Users className="size-4" />
              {program.participantCount} participant{program.participantCount !== 1 ? "s" : ""}
            </div>
            {program.startDate && (
              <div className="flex items-center gap-1 text-slate-500">
                <Calendar className="size-4" />
                {format(new Date(program.startDate), "MMM d, yyyy")}
              </div>
            )}
          </div>
          {program.completionCriteria && (
            <div className="mt-2 text-xs text-slate-400">
              {program.completionCriteria.type === "attendance_count"
                ? `${program.completionCriteria.requiredCount} sessions required`
                : program.completionCriteria.type === "attendance_percentage"
                  ? `${program.completionCriteria.requiredPercentage}% attendance required`
                  : "Manual completion"}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
