import { useMutation } from 'convex/react'
import { Save } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import type { Slot, SlotPreference } from '~/lib/program-constants'
import { Button } from '~/components/ui/button'
import { Spinner } from '~/components/ui/spinner'
import { rsvpPreferenceColors, slotLabels } from '~/lib/program-constants'
import { cn } from '~/lib/utils'

interface SessionData {
  _id: Id<'programSessions'>
  dayNumber: number
  title: string
}

interface Participant {
  _id: Id<'programParticipation'>
  userId: string
  memberName: string
  status: string
}

interface AttendanceRecord {
  sessionId: Id<'programSessions'>
  userId: string
  slot: Slot
}

interface RsvpRecord {
  sessionId: Id<'programSessions'>
  userId: string
  preference: SlotPreference
}

interface AttendanceSheetProps {
  sessions: Array<SessionData>
  participants: Array<Participant>
  attendance: Array<AttendanceRecord>
  rsvps: Array<RsvpRecord>
}

export function AttendanceSheet({
  sessions,
  participants,
  attendance,
  rsvps,
}: AttendanceSheetProps) {
  const [activeTab, setActiveTab] = useState(0)
  const [localAttendance, setLocalAttendance] = useState<
    Map<string, Slot | null>
  >(new Map())
  const [isSaving, setIsSaving] = useState(false)
  const batchMark = useMutation(api.programs.batchMarkAttendance)
  const removeAtt = useMutation(api.programs.removeAttendance)

  const activeSession = sessions[activeTab]

  const enrolledParticipants = useMemo(
    () =>
      participants.filter(
        (p) => p.status === 'enrolled' || p.status === 'completed',
      ),
    [participants],
  )

  // Pre-build attendance lookup: sessionId+userId -> slot
  const attendanceLookup = useMemo(() => {
    const map = new Map<string, Slot>()
    for (const a of attendance) {
      map.set(`${a.sessionId}:${a.userId}`, a.slot)
    }
    return map
  }, [attendance])

  // Pre-build RSVP lookup: sessionId+userId -> preference
  const rsvpLookup = useMemo(() => {
    const map = new Map<string, SlotPreference>()
    for (const r of rsvps) {
      map.set(`${r.sessionId}:${r.userId}`, r.preference)
    }
    return map
  }, [rsvps])

  // Build server attendance map for the active session
  // sessions[activeTab] can be undefined at runtime when sessions is empty,
  // but TS doesn't know this without noUncheckedIndexedAccess
  const activeSessionId = sessions.at(activeTab)?._id
  const serverMap = useMemo(() => {
    const map = new Map<string, Slot | null>()
    if (!activeSessionId) return map
    for (const p of enrolledParticipants) {
      const slot = attendanceLookup.get(`${activeSessionId}:${p.userId}`)
      map.set(p.userId, slot ?? null)
    }
    return map
  }, [activeSessionId, enrolledParticipants, attendanceLookup])

  // Sync local state when server map changes (tab switch or data update)
  const [lastServerMapRef, setLastServerMapRef] = useState(serverMap)
  if (serverMap !== lastServerMapRef) {
    setLastServerMapRef(serverMap)
    setLocalAttendance(serverMap)
  }

  if (sessions.length === 0) {
    return (
      <p className="text-slate-500 text-sm text-center py-4">
        No sessions created yet
      </p>
    )
  }

  const toggleSlot = (userId: string, slot: Slot) => {
    setLocalAttendance((prev) => {
      const next = new Map(prev)
      const current = next.get(userId)
      next.set(userId, current === slot ? null : slot)
      return next
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const attendees: Array<{ userId: string; slot: Slot }> = []
      const removals: Array<string> = []

      for (const [userId, slot] of localAttendance) {
        const serverSlot = serverMap.get(userId)
        if (slot) {
          if (serverSlot !== slot) {
            attendees.push({ userId, slot })
          }
        } else if (serverSlot) {
          removals.push(userId)
        }
      }

      const promises: Array<Promise<unknown>> = []
      if (attendees.length > 0) {
        promises.push(batchMark({ sessionId: activeSession._id, attendees }))
      }
      for (const userId of removals) {
        promises.push(removeAtt({ sessionId: activeSession._id, userId }))
      }
      await Promise.all(promises)

      toast.success('Attendance saved')
    } catch (error) {
      toast.error('Failed to save attendance')
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  // Check if there are unsaved changes
  const hasChanges = useMemo(() => {
    for (const [userId, slot] of localAttendance) {
      if (serverMap.get(userId) !== slot) return true
    }
    return false
  }, [localAttendance, serverMap])

  return (
    <div>
      {/* Session tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto">
        {sessions.map((s, i) => (
          <button
            key={s._id}
            onClick={() => setActiveTab(i)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              i === activeTab
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Day {s.dayNumber}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="text-left text-sm font-medium text-slate-500 px-4 py-2">
                Participant
              </th>
              <th className="text-center text-sm font-medium text-slate-500 px-4 py-2">
                RSVP
              </th>
              <th className="text-center text-sm font-medium text-slate-500 px-4 py-2">
                Morning
              </th>
              <th className="text-center text-sm font-medium text-slate-500 px-4 py-2">
                Afternoon
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {enrolledParticipants.map((p) => {
              const rsvp = rsvpLookup.get(`${activeSession._id}:${p.userId}`)
              const currentSlot = localAttendance.get(p.userId) ?? null

              return (
                <tr key={p.userId} className="hover:bg-slate-50">
                  <td className="px-4 py-2 text-sm font-medium text-foreground">
                    {p.memberName}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {rsvp ? (
                      <span
                        className={cn(
                          rsvpPreferenceColors[rsvp],
                          'px-2 py-0.5 rounded text-xs font-medium',
                        )}
                      >
                        {slotLabels[rsvp]}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={currentSlot === 'morning'}
                      onChange={() => toggleSlot(p.userId, 'morning')}
                      className="rounded"
                    />
                  </td>
                  <td className="px-4 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={currentSlot === 'afternoon'}
                      onChange={() => toggleSlot(p.userId, 'afternoon')}
                      className="rounded"
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end mt-4">
        <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
          {isSaving ? (
            <Spinner className="size-4 mr-1" />
          ) : (
            <Save className="size-4 mr-1" />
          )}
          Save Attendance
        </Button>
      </div>
    </div>
  )
}
