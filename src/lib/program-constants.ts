export const programTypeLabels = {
  reading_group: 'Reading Group',
  fellowship: 'Fellowship',
  mentorship: 'Mentorship',
  cohort: 'Cohort',
  workshop_series: 'Workshop Series',
  custom: 'Custom',
} as const

export const programStatusColors = {
  planning: 'bg-slate-100 text-slate-700',
  active: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  archived: 'bg-slate-50 text-slate-500',
} as const

export const moduleStatusColors = {
  locked: 'bg-slate-100 text-slate-600',
  available: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
} as const
