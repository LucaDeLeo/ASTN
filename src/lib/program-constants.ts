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

export type SlotPreference = 'morning' | 'afternoon' | 'either'
export type Slot = 'morning' | 'afternoon'

export interface MaterialItem {
  label: string
  url?: string
  type: 'link' | 'pdf' | 'video' | 'reading' | 'audio'
  estimatedMinutes?: number
  isEssential?: boolean
  storageId?: string
  audioUrl?: string
}

export const slotLabels = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  either: 'Either',
} as const

export const rsvpPreferenceColors = {
  morning: 'bg-amber-100 text-amber-700',
  afternoon: 'bg-indigo-100 text-indigo-700',
  either: 'bg-slate-100 text-slate-600',
} as const
