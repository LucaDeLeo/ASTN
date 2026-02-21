import { useEffect, useRef } from 'react'
import { Check, ChevronDown, Pencil } from 'lucide-react'
import { Card } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'

interface ProfileSectionCardProps {
  id: string
  title: string
  icon: React.ReactNode
  isComplete: boolean
  isEditing: boolean
  onToggleEdit: () => void
  children: React.ReactNode
  editContent: React.ReactNode
}

export function ProfileSectionCard({
  id,
  title,
  icon,
  isComplete,
  isEditing,
  onToggleEdit,
  children,
  editContent,
}: ProfileSectionCardProps) {
  const prevEditingRef = useRef(isEditing)

  useEffect(() => {
    if (isEditing && !prevEditingRef.current) {
      const timer = setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }, 50)
      return () => clearTimeout(timer)
    }
    prevEditingRef.current = isEditing
  }, [isEditing, id])

  return (
    <div id={id} className="scroll-mt-8">
      <Card
        className={cn(
          'transition-all duration-200',
          isEditing && 'ring-2 ring-primary/20',
        )}
      >
        {/* Clickable header */}
        <button
          type="button"
          onClick={onToggleEdit}
          className={cn(
            'flex items-center justify-between w-full px-4 py-3 text-left',
            !isEditing && 'hover:bg-muted/30 rounded-lg cursor-pointer',
          )}
        >
          <div className="flex items-center gap-2.5">
            {icon}
            <h2 className="text-base font-display font-semibold text-foreground">
              {title}
            </h2>
            {isComplete && (
              <div className="size-4.5 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="size-2.5 text-green-600" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <Pencil className="size-3.5 text-muted-foreground" />
            )}
            <ChevronDown
              className={cn(
                'size-3.5 text-muted-foreground transition-transform duration-200',
                isEditing && 'rotate-180',
              )}
            />
          </div>
        </button>

        {/* View content — collapses when editing */}
        <div
          className={cn(
            'grid transition-[grid-template-rows] duration-200 ease-in-out',
            !isEditing ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
          )}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="px-4 pb-3">{children}</div>
          </div>
        </div>

        {/* Edit content — expands when editing */}
        <div
          className={cn(
            'grid transition-[grid-template-rows] duration-200 ease-in-out',
            isEditing ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
          )}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="px-4 pb-4">
              {editContent}
              <div className="mt-4 pt-3 border-t flex justify-end">
                <Button variant="outline" size="sm" onClick={onToggleEdit}>
                  Done
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
