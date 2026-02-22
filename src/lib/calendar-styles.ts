import { cn } from '~/lib/utils'

/**
 * Shared DayPicker classNames used across all calendar instances.
 * Uses CSS Grid overlay pattern for nav button positioning.
 */
export const calendarClassNames = {
  root: 'p-3 mx-auto w-fit',
  months: 'relative flex flex-col sm:flex-row gap-4',
  month: 'flex flex-col gap-4',
  month_caption: 'flex justify-center items-center',
  caption_label: 'text-sm font-medium',
  nav: 'absolute top-0 inset-x-0 flex items-center justify-between z-10',
  button_previous:
    'size-7 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center rounded-md border border-input hover:bg-accent hover:text-accent-foreground',
  button_next:
    'size-7 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center rounded-md border border-input hover:bg-accent hover:text-accent-foreground',
  month_grid: 'w-full border-collapse space-y-1',
  weekdays: 'flex',
  weekday: 'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]',
  week: 'flex w-full mt-2',
  day: cn(
    'size-9 text-center text-sm p-0 relative',
    'focus-within:relative focus-within:z-20',
  ),
  selected:
    'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-md',
  today: 'bg-accent text-accent-foreground rounded-md',
  outside:
    'text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30',
  disabled: 'text-muted-foreground opacity-50 cursor-not-allowed',
  hidden: 'invisible',
}
