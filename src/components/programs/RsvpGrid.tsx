import type { SlotPreference } from '~/lib/program-constants'
import { rsvpPreferenceColors, slotLabels } from '~/lib/program-constants'
import { cn } from '~/lib/utils'

interface RsvpData {
  userId: string
  userName: string
  preference: SlotPreference
}

interface RsvpGridProps {
  rsvps: Array<RsvpData>
}

export function RsvpGrid({ rsvps }: RsvpGridProps) {
  if (rsvps.length === 0) {
    return <p className="text-xs text-slate-400">No RSVPs yet</p>
  }

  const groups: Record<SlotPreference, Array<string>> = {
    morning: [],
    afternoon: [],
    either: [],
  }

  for (const rsvp of rsvps) {
    groups[rsvp.preference].push(rsvp.userName)
  }

  const slots: Array<SlotPreference> = ['morning', 'afternoon', 'either']

  return (
    <div className="space-y-1.5">
      {slots.map((slot) => {
        const names = groups[slot]
        if (names.length === 0) return null
        return (
          <div key={slot} className="flex items-start gap-2 text-xs">
            <span
              className={cn(
                rsvpPreferenceColors[slot],
                'px-1.5 py-0.5 rounded shrink-0 font-medium',
              )}
            >
              {slotLabels[slot]} ({names.length})
            </span>
            <span className="text-slate-500 leading-5">{names.join(', ')}</span>
          </div>
        )
      })}
    </div>
  )
}
