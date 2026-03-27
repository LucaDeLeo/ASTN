<script lang="ts">
  import { cn } from '~/lib/utils'

  type SlotStatus = 'available' | 'maybe'
  type PaintMode = SlotStatus | 'clear'

  let {
    startDate,
    endDate,
    startMinutes,
    endMinutes,
    slotDurationMinutes,
    slots,
    onSlotsChange,
    readOnly = false,
    finalizedSlot,
  }: {
    startDate: string
    endDate: string
    startMinutes: number
    endMinutes: number
    slotDurationMinutes: number
    slots: Record<string, SlotStatus>
    onSlotsChange: (slots: Record<string, SlotStatus>) => void
    readOnly?: boolean
    finalizedSlot?: { date: string; startMinutes: number; endMinutes: number }
  } = $props()

  const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
  const SHORT_MONTHS = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ] as const

  let paintMode = $state<PaintMode>('available')
  let isDragging = $state(false)
  let lastPointerType = $state('')

  const dates = $derived.by(() => {
    const values: Array<string> = []
    const [startYear, startMonth, startDay] = startDate.split('-').map(Number)
    const [endYear, endMonth, endDay] = endDate.split('-').map(Number)
    const current = new Date(startYear, startMonth - 1, startDay)
    const end = new Date(endYear, endMonth - 1, endDay)

    while (current <= end) {
      const y = current.getFullYear()
      const mo = String(current.getMonth() + 1).padStart(2, '0')
      const d = String(current.getDate()).padStart(2, '0')
      values.push(`${y}-${mo}-${d}`)
      current.setDate(current.getDate() + 1)
    }

    return values
  })

  const timeSlots = $derived.by(() => {
    const values: Array<number> = []
    for (let minutes = startMinutes; minutes < endMinutes; minutes += slotDurationMinutes) {
      values.push(minutes)
    }
    return values
  })

  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    const period = h >= 12 ? 'PM' : 'AM'
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
    return m === 0
      ? `${h12} ${period}`
      : `${h12}:${String(m).padStart(2, '0')} ${period}`
  }

  const formatDateHeader = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return {
      dayName: SHORT_DAYS[date.getDay()],
      dayLabel: `${SHORT_MONTHS[date.getMonth()]} ${date.getDate()}`,
    }
  }

  const isFinalized = (dateStr: string, slotMinutes: number) => {
    if (!finalizedSlot || dateStr !== finalizedSlot.date) return false
    const slotEnd = slotMinutes + slotDurationMinutes
    return (
      slotMinutes >= finalizedSlot.startMinutes &&
      slotEnd <= finalizedSlot.endMinutes
    )
  }

  const paintCell = (key: string) => {
    const next = { ...slots }
    if (paintMode === 'clear') {
      delete next[key]
    } else {
      next[key] = paintMode
    }
    onSlotsChange(next)
  }

  const handlePointerDown = (key: string, event: PointerEvent) => {
    if (readOnly) return
    lastPointerType = event.pointerType
    if (event.pointerType === 'touch') return
    isDragging = true
    paintCell(key)
  }

  const handlePointerEnter = (key: string) => {
    if (readOnly || !isDragging) return
    paintCell(key)
  }

  const handleCellClick = (key: string) => {
    if (readOnly || lastPointerType !== 'touch') return
    paintCell(key)
  }

  const clearAll = () => onSlotsChange({})
</script>

<div class="flex flex-col gap-3">
  {#if !readOnly}
    <div class="flex flex-wrap items-center gap-2">
      <button
        type="button"
        class={cn(
          'rounded-lg border px-3 py-1.5 text-sm font-medium transition',
          paintMode === 'available'
            ? 'border-green-500 bg-green-500 text-white'
            : 'border-border bg-white text-slate-600 hover:border-green-400 hover:text-green-700',
        )}
        onclick={() => {
          paintMode = 'available'
        }}
      >
        Available
      </button>
      <button
        type="button"
        class={cn(
          'rounded-lg border px-3 py-1.5 text-sm font-medium transition',
          paintMode === 'maybe'
            ? 'border-amber-400 bg-amber-300 text-slate-950'
            : 'border-border bg-white text-slate-600 hover:border-amber-300 hover:text-amber-700',
        )}
        onclick={() => {
          paintMode = 'maybe'
        }}
      >
        Maybe
      </button>
      <button
        type="button"
        class={cn(
          'rounded-lg border px-3 py-1.5 text-sm font-medium transition',
          paintMode === 'clear'
            ? 'border-slate-400 bg-slate-300 text-slate-950'
            : 'border-border bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900',
        )}
        onclick={() => {
          paintMode = 'clear'
        }}
      >
        Clear
      </button>

      {#if Object.keys(slots).length > 0}
        <button
          type="button"
          class="ml-auto rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          onclick={clearAll}
        >
          Clear all
        </button>
      {/if}
    </div>
  {/if}

  <div
    role="presentation"
    class="overflow-x-auto select-none"
    onpointerup={() => {
      isDragging = false
    }}
    onpointerleave={() => {
      isDragging = false
    }}
  >
    <table class="border-collapse">
      <thead>
        <tr>
          <th class="sticky left-0 z-10 bg-white/95 p-1"></th>
          {#each dates as dateStr}
            {@const header = formatDateHeader(dateStr)}
            <th class="min-w-[60px] px-1 pb-1 text-center text-xs font-medium text-slate-500">
              <div>{header.dayName}</div>
              <div>{header.dayLabel}</div>
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each timeSlots as minutes}
          <tr>
            <td class="sticky left-0 z-10 bg-white/95 pr-2 text-right text-xs font-medium text-slate-500">
              {formatTime(minutes)}
            </td>
            {#each dates as dateStr}
              {@const key = `${dateStr}:${minutes}`}
              {@const status = slots[key]}
              {@const finalized = isFinalized(dateStr, minutes)}
              <td class="p-1">
                <button
                  type="button"
                  aria-label={`${dateStr} at ${formatTime(minutes)}`}
                  class={cn(
                    'h-7 w-[60px] rounded-md border transition',
                    finalized && 'border-blue-500 bg-blue-500 text-white',
                    !finalized && status === 'available' && 'border-green-500 bg-green-500 text-white',
                    !finalized && status === 'maybe' && 'border-amber-300 bg-amber-300 text-slate-950',
                    !finalized &&
                      !status &&
                      'border-slate-200 bg-white hover:border-coral-300 hover:bg-coral-50',
                  )}
                  disabled={readOnly}
                  onpointerdown={(event) => handlePointerDown(key, event)}
                  onpointerenter={() => handlePointerEnter(key)}
                  onclick={() => handleCellClick(key)}
                ></button>
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
