import { useMutation } from 'convex/react'
import { useState } from 'react'
import { toast } from 'sonner'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import type { SlotPreference } from '~/lib/program-constants'
import { rsvpPreferenceColors, slotLabels } from '~/lib/program-constants'
import { cn } from '~/lib/utils'

interface RsvpSelectorProps {
  sessionId: Id<'programSessions'>
  currentPreference?: SlotPreference
}

export function RsvpSelector({
  sessionId,
  currentPreference,
}: RsvpSelectorProps) {
  const [isUpdating, setIsUpdating] = useState<SlotPreference | null>(null)
  const setRsvp = useMutation(api.programs.setSessionRsvp)

  const handleSelect = async (preference: SlotPreference) => {
    if (preference === currentPreference) return
    setIsUpdating(preference)
    try {
      await setRsvp({ sessionId, preference })
    } catch (error) {
      toast.error('Failed to update RSVP')
      console.error(error)
    } finally {
      setIsUpdating(null)
    }
  }

  const options: Array<SlotPreference> = ['morning', 'afternoon', 'either']

  return (
    <div className="flex gap-1.5">
      {options.map((pref) => (
        <button
          key={pref}
          onClick={() => handleSelect(pref)}
          disabled={isUpdating !== null}
          className={cn(
            'px-3 py-1 rounded-full text-xs font-medium transition-all',
            currentPreference === pref
              ? rsvpPreferenceColors[pref]
              : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600',
            isUpdating === pref && 'opacity-50',
          )}
        >
          {slotLabels[pref]}
        </button>
      ))}
    </div>
  )
}
