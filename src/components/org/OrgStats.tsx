import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

interface OrgStatsProps {
  stats: {
    memberCount: number;
    adminCount: number;
    joinedThisMonth: number;
    skillsDistribution: Array<{ name: string; count: number }>;
    completenessDistribution: {
      high: number;
      medium: number;
      low: number;
    };
  };
}

export function OrgStats({ stats }: OrgStatsProps) {
  const { skillsDistribution, completenessDistribution } = stats;

  const totalMembers =
    completenessDistribution.high +
    completenessDistribution.medium +
    completenessDistribution.low;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Skills Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Skills</CardTitle>
        </CardHeader>
        <CardContent>
          {skillsDistribution.length === 0 ? (
            <p className="text-slate-500 text-sm">
              No skills data available yet. Members need to add skills to their
              profiles.
            </p>
          ) : (
            <div className="space-y-3">
              {skillsDistribution.map((skill) => {
                // Calculate max for scaling (at least 1 to avoid division by zero)
                const maxCount = Math.max(
                  ...skillsDistribution.map((s) => s.count),
                  1
                );
                const percentage = (skill.count / maxCount) * 100;

                return (
                  <div key={skill.name}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-slate-700 truncate pr-2">
                        {skill.name}
                      </span>
                      <span className="text-slate-500 shrink-0">
                        {skill.count}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile Completeness Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profile Completeness</CardTitle>
        </CardHeader>
        <CardContent>
          {totalMembers === 0 ? (
            <p className="text-slate-500 text-sm">
              No members yet to analyze profile completeness.
            </p>
          ) : (
            <div className="space-y-4">
              <CompletenessBar
                label="High"
                sublabel="> 70%"
                count={completenessDistribution.high}
                total={totalMembers}
                color="bg-green-500"
              />
              <CompletenessBar
                label="Medium"
                sublabel="40-70%"
                count={completenessDistribution.medium}
                total={totalMembers}
                color="bg-amber-500"
              />
              <CompletenessBar
                label="Low"
                sublabel="< 40%"
                count={completenessDistribution.low}
                total={totalMembers}
                color="bg-red-500"
              />

              {/* Summary */}
              <div className="pt-4 border-t">
                <p className="text-sm text-slate-600">
                  {completenessDistribution.high} of {totalMembers} members (
                  {totalMembers > 0
                    ? Math.round(
                        (completenessDistribution.high / totalMembers) * 100
                      )
                    : 0}
                  %) have highly complete profiles.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface CompletenessBarProps {
  label: string;
  sublabel: string;
  count: number;
  total: number;
  color: string;
}

function CompletenessBar({
  label,
  sublabel,
  count,
  total,
  color,
}: CompletenessBarProps) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <div>
          <span className="text-slate-700 font-medium">{label}</span>
          <span className="text-slate-400 ml-1">({sublabel})</span>
        </div>
        <span className="text-slate-500">
          {count} member{count !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
