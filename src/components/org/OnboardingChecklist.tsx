import { Link } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { CheckCircle2, Circle } from 'lucide-react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'

interface OnboardingChecklistProps {
  orgId: Id<'organizations'>
  orgSlug: string
}

export function OnboardingChecklist({
  orgId,
  orgSlug,
}: OnboardingChecklistProps) {
  const progress = useQuery(api.orgs.admin.getOnboardingProgress, { orgId })

  if (!progress) return null

  // Hide when complete
  if (progress.isComplete) {
    return (
      <Card className="mb-8 border-green-200 bg-green-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-green-800">
            <CheckCircle2 className="size-5" />
            Setup Complete
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-green-700">
            Your organization is ready. Members can now join and book co-working
            spots.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-8">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Getting Started</CardTitle>
          <span className="text-sm text-muted-foreground">
            {progress.completedCount} of {progress.totalCount} complete
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden mt-2">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="space-y-2">
          {progress.steps.map((step) => (
            <li key={step.id}>
              {step.complete ? (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <CheckCircle2 className="size-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm line-through">{step.label}</span>
                </div>
              ) : (
                <Link
                  to={
                    step.route === 'setup'
                      ? '/org/$slug/admin/setup'
                      : '/org/$slug/admin/space'
                  }
                  params={{ slug: orgSlug }}
                  className="flex items-center gap-3 text-foreground hover:text-primary transition-colors group"
                >
                  <Circle className="size-5 text-slate-300 group-hover:text-primary flex-shrink-0" />
                  <span className="text-sm">{step.label}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
