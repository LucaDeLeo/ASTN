// Placeholder - to be fully implemented in Task 3
import type { Id } from 'convex/_generated/dataModel'

interface SpaceInfo {
  spaceId: Id<'coworkingSpaces'>
  spaceName: string
  orgId: Id<'organizations'>
  orgName: string
  orgSlug?: string
  capacity: number
  timezone: string
  operatingHours: Array<{
    dayOfWeek: number
    openMinutes: number
    closeMinutes: number
    isClosed: boolean
  }>
  customVisitFields: Array<{
    fieldId: string
    label: string
    type: 'text' | 'textarea' | 'select' | 'checkbox'
    required: boolean
    options?: Array<string>
    placeholder?: string
  }>
}

interface VisitApplicationFormProps {
  spaceInfo: SpaceInfo
}

export function VisitApplicationForm({ spaceInfo }: VisitApplicationFormProps) {
  return <div>Loading application form for {spaceInfo.spaceName}...</div>
}
