import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import {
  Activity,
  DollarSign,
  Shield,
  Target,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api } from '../../../../convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Spinner } from '~/components/ui/spinner'

export const Route = createFileRoute('/admin/costs/')({
  component: AdminCostsPage,
})

type TimeRange = '7d' | '30d' | '90d' | 'all'

const RANGE_DAYS: Record<TimeRange, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  all: 365 * 2,
}

const RANGE_LABELS: Record<TimeRange, string> = {
  '7d': '7 Days',
  '30d': '30 Days',
  '90d': '90 Days',
  all: 'All Time',
}

const GRANULARITY_MAP: Record<TimeRange, 'day' | 'week' | 'month'> = {
  '7d': 'day',
  '30d': 'day',
  '90d': 'week',
  all: 'month',
}

const MODEL_COLORS: Record<string, string> = {
  'Sonnet 4.6': '#8b5cf6',
  'Haiku 4.5': '#06b6d4',
  'Gemini Flash': '#f59e0b',
  'Kimi K2.5': '#10b981',
}

const PIE_COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ef4444']

type ModelCostEntry = {
  displayName: string
  callCount: number
  totalInputTokens: number
  totalOutputTokens: number
  costUsd: number
}

function formatUsd(value: number): string {
  if (value >= 1) return `$${value.toFixed(2)}`
  if (value >= 0.01) return `$${value.toFixed(3)}`
  return `$${value.toFixed(4)}`
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function renderPieLabel({
  displayName,
  percent,
}: {
  displayName: string
  percent: number
}) {
  return `${displayName} ${(percent * 100).toFixed(0)}%`
}

function AdminCostsPage() {
  const isPlatformAdmin = useQuery(api.orgApplications.checkPlatformAdmin)

  if (isPlatformAdmin === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner />
      </div>
    )
  }

  if (!isPlatformAdmin) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <Shield className="size-8 text-slate-400" />
        </div>
        <h1 className="text-2xl font-display text-foreground mb-4">
          Platform Admin Access Required
        </h1>
        <p className="text-slate-600">
          You need platform admin access to view LLM costs.
        </p>
      </div>
    )
  }

  return <CostsDashboard />
}

function getTimeRange(range: TimeRange) {
  const now = Date.now()
  return { startTime: now - RANGE_DAYS[range] * 86_400_000, endTime: now }
}

function CostsDashboard() {
  const [range, setRange] = useState<TimeRange>('30d')
  const [timeRange, setTimeRange] = useState(() => getTimeRange('30d'))

  const { startTime, endTime } = timeRange
  const granularity = GRANULARITY_MAP[range]

  const timeSeries = useQuery(api.platformAdmin.llmCosts.getCostTimeSeries, {
    startTime,
    endTime,
    granularity,
  })
  const byModel = useQuery(api.platformAdmin.llmCosts.getCostByModel, {
    startTime,
    endTime,
  })
  const byOperation = useQuery(api.platformAdmin.llmCosts.getCostByOperation, {
    startTime,
    endTime,
  })
  const matchingStats = useQuery(api.platformAdmin.llmCosts.getMatchingStats, {
    startTime,
    endTime,
  })
  const overall = useQuery(api.platformAdmin.llmCosts.getOverallStats, {
    startTime,
    endTime,
  })

  const modelNames = useMemo(() => {
    if (!timeSeries || timeSeries.length === 0) return []
    const keys = new Set<string>()
    for (const entry of timeSeries) {
      for (const key of Object.keys(entry)) {
        if (
          key !== 'periodStart' &&
          key !== 'periodLabel' &&
          key !== 'totalCostUsd'
        ) {
          keys.add(key)
        }
      }
    }
    return [...keys]
  }, [timeSeries])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display text-foreground">LLM Costs</h1>
        <div className="flex gap-1 rounded-lg border bg-muted p-1">
          {(Object.keys(RANGE_LABELS) as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => {
                setRange(r)
                setTimeRange(getTimeRange(r))
              }}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                range === r
                  ? 'bg-background text-foreground shadow-sm font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      {overall ? (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <KpiCard
            icon={DollarSign}
            label="Total Spend"
            value={formatUsd(overall.totalCostUsd)}
          />
          <KpiCard
            icon={Zap}
            label="API Calls"
            value={overall.totalCalls.toLocaleString()}
          />
          <KpiCard
            icon={Activity}
            label="Avg Cost / Call"
            value={formatUsd(overall.avgCostPerCallUsd)}
          />
          <KpiCard
            icon={TrendingUp}
            label="Top Operation"
            value={overall.mostExpensiveOperation}
            subValue={formatUsd(overall.mostExpensiveOperationCostUsd)}
          />
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="h-12 flex items-center justify-center">
                  <Spinner />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Time Series Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cost Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          {timeSeries ? (
            timeSeries.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={timeSeries}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="periodLabel"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    tickFormatter={(v: number) => `$${v.toFixed(2)}`}
                  />
                  <Tooltip
                    formatter={(value: unknown, name: unknown) => [
                      formatUsd(Number(value)),
                      String(name),
                    ]}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid hsl(var(--border))',
                      background: 'hsl(var(--background))',
                    }}
                  />
                  <Legend />
                  {modelNames.map((name) => (
                    <Bar
                      key={name}
                      dataKey={name}
                      stackId="cost"
                      fill={MODEL_COLORS[name] ?? '#94a3b8'}
                      radius={[0, 0, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">
                No usage data for this period.
              </p>
            )
          ) : (
            <div className="flex items-center justify-center h-[320px]">
              <Spinner />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Model + Operation Breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Model Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cost by Model</CardTitle>
          </CardHeader>
          <CardContent>
            {byModel ? (
              byModel.length > 0 ? (
                <div className="flex flex-col items-center">
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={byModel}
                        dataKey="costUsd"
                        nameKey="displayName"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={100}
                        paddingAngle={2}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        label={renderPieLabel as any}
                        labelLine={false}
                      >
                        {byModel.map((_: unknown, i: number) => (
                          <Cell
                            key={i}
                            fill={PIE_COLORS[i % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: unknown) => formatUsd(Number(value))}
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid hsl(var(--border))',
                          background: 'hsl(var(--background))',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="w-full mt-4 space-y-2">
                    {byModel.map((m: ModelCostEntry, i: number) => (
                      <div
                        key={m.displayName}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="size-3 rounded-full"
                            style={{
                              background: PIE_COLORS[i % PIE_COLORS.length],
                            }}
                          />
                          <span>{m.displayName}</span>
                        </div>
                        <div className="flex gap-4 text-muted-foreground">
                          <span>{m.callCount} calls</span>
                          <span>
                            {formatTokens(
                              m.totalInputTokens + m.totalOutputTokens,
                            )}{' '}
                            tokens
                          </span>
                          <span className="text-foreground font-medium">
                            {formatUsd(m.costUsd)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-12">
                  No data.
                </p>
              )
            ) : (
              <div className="flex items-center justify-center h-[260px]">
                <Spinner />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Operation Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cost by Operation</CardTitle>
          </CardHeader>
          <CardContent>
            {byOperation ? (
              byOperation.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={byOperation}
                    layout="vertical"
                    margin={{ left: 20 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="opacity-30"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(v: number) => `$${v.toFixed(2)}`}
                    />
                    <YAxis
                      type="category"
                      dataKey="label"
                      tick={{ fontSize: 12 }}
                      width={130}
                    />
                    <Tooltip
                      formatter={(value: unknown) => formatUsd(Number(value))}
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid hsl(var(--border))',
                        background: 'hsl(var(--background))',
                      }}
                    />
                    <Bar
                      dataKey="costUsd"
                      fill="#8b5cf6"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-12">
                  No data.
                </p>
              )
            ) : (
              <div className="flex items-center justify-center h-[260px]">
                <Spinner />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Matching Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="size-4" />
            Matching Costs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {matchingStats ? (
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <StatBlock
                label="Users Matched"
                value={matchingStats.uniqueUsersMatched.toString()}
                icon={Users}
              />
              <StatBlock
                label="Avg Cost / User"
                value={formatUsd(matchingStats.avgCostPerUserUsd)}
                icon={DollarSign}
              />
              <StatBlock
                label="Coarse Matching"
                value={formatUsd(matchingStats.coarseCostUsd)}
                sub={`${matchingStats.coarseCalls} calls`}
              />
              <StatBlock
                label="Detailed Matching"
                value={formatUsd(matchingStats.detailedCostUsd)}
                sub={`${matchingStats.detailedCalls} calls`}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-24">
              <Spinner />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function KpiCard({
  icon: Icon,
  label,
  value,
  subValue,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  subValue?: string
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="size-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-xl font-semibold truncate">{value}</p>
            {subValue && (
              <p className="text-xs text-muted-foreground">{subValue}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StatBlock({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string
  value: string
  sub?: string
  icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="text-center p-4 rounded-lg bg-muted/50">
      {Icon && <Icon className="size-4 text-muted-foreground mx-auto mb-1" />}
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  )
}
