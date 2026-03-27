import type {
  ExtractedData,
  ResumeReviewItem,
  ResumeReviewStatus,
} from '~/components/profile/extraction/types'

type EducationEntry = NonNullable<ExtractedData['education']>[0]
type WorkHistoryEntry = NonNullable<ExtractedData['workHistory']>[0]

export type AppliedData = Partial<ExtractedData>

function formatEducationLabel(education: EducationEntry): string {
  const parts: Array<string> = []

  if (education.degree) parts.push(education.degree)
  if (education.field) parts.push(`in ${education.field}`)
  parts.push(`at ${education.institution}`)

  return parts.join(' ')
}

function formatWorkLabel(work: WorkHistoryEntry): string {
  return `${work.title} at ${work.organization}`
}

function buildReviewItems(data: ExtractedData): Array<ResumeReviewItem> {
  const items: Array<ResumeReviewItem> = []

  if (data.name) {
    items.push({
      id: 'name',
      field: 'name',
      label: 'Name',
      value: data.name,
      status: 'accepted',
    })
  }

  if (data.email) {
    items.push({
      id: 'email',
      field: 'email',
      label: 'Email',
      value: data.email,
      status: 'accepted',
    })
  }

  if (data.location) {
    items.push({
      id: 'location',
      field: 'location',
      label: 'Location',
      value: data.location,
      status: 'accepted',
    })
  }

  if (data.education?.length) {
    data.education.forEach((education, index) => {
      items.push({
        id: `education.${index}`,
        field: 'education',
        index,
        label: formatEducationLabel(education),
        value: education,
        status: 'accepted',
      })
    })
  }

  if (data.workHistory?.length) {
    data.workHistory.forEach((work, index) => {
      items.push({
        id: `workHistory.${index}`,
        field: 'workHistory',
        index,
        label: formatWorkLabel(work),
        value: work,
        status: 'accepted',
      })
    })
  }

  if (data.skills?.length) {
    items.push({
      id: 'skills',
      field: 'skills',
      label: `Skills (${data.skills.length})`,
      value: data.skills,
      status: 'accepted',
    })
  }

  return items
}

export class ResumeReviewStore {
  extractedData = $state<ExtractedData | null>(null)
  items = $state<Array<ResumeReviewItem>>([])

  constructor(initialData: ExtractedData | null = null) {
    this.setExtractedData(initialData)
  }

  setExtractedData(data: ExtractedData | null) {
    this.extractedData = data
    this.items = data ? buildReviewItems(data) : []
  }

  updateStatus(id: string, status: ResumeReviewStatus) {
    this.items = this.items.map((item) =>
      item.id === id ? { ...item, status } : item,
    )
  }

  updateValue(id: string, value: unknown) {
    this.items = this.items.map((item) =>
      item.id === id ? { ...item, editedValue: value, status: 'edited' } : item,
    )
  }

  acceptAll() {
    this.items = this.items.map((item) =>
      item.status === 'pending' ? { ...item, status: 'accepted' } : item,
    )
  }

  reset() {
    this.items = this.items.map((item) => ({
      ...item,
      status: 'accepted',
      editedValue: undefined,
    }))
  }

  get acceptedCount() {
    return this.items.filter(
      (item) => item.status === 'accepted' || item.status === 'edited',
    ).length
  }

  get totalFields() {
    return this.items.length
  }

  get hasAcceptedFields() {
    return this.acceptedCount > 0
  }

  getAcceptedData(): AppliedData {
    const result: AppliedData = {}

    const educationItems = this.items.filter(
      (item) =>
        item.field === 'education' &&
        (item.status === 'accepted' || item.status === 'edited'),
    )

    if (educationItems.length > 0) {
      result.education = educationItems.map((item) =>
        item.status === 'edited' && item.editedValue !== undefined
          ? (item.editedValue as EducationEntry)
          : (item.value as EducationEntry),
      )
    }

    const workItems = this.items.filter(
      (item) =>
        item.field === 'workHistory' &&
        (item.status === 'accepted' || item.status === 'edited'),
    )

    if (workItems.length > 0) {
      result.workHistory = workItems.map((item) =>
        item.status === 'edited' && item.editedValue !== undefined
          ? (item.editedValue as WorkHistoryEntry)
          : (item.value as WorkHistoryEntry),
      )
    }

    for (const item of this.items) {
      if (item.status !== 'accepted' && item.status !== 'edited') {
        continue
      }

      const value =
        item.status === 'edited' && item.editedValue !== undefined
          ? item.editedValue
          : item.value

      switch (item.field) {
        case 'name':
          result.name = value as string
          break
        case 'location':
          result.location = value as string
          break
        case 'skills':
          result.skills = value as Array<string>
          break
        default:
          break
      }
    }

    return result
  }
}

export function createResumeReviewStore(extractedData: ExtractedData | null) {
  return new ResumeReviewStore(extractedData)
}
