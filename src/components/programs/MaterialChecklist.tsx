import { useMutation } from 'convex/react'
import { ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import type { MaterialItem } from '~/lib/program-constants'
import { MaterialIcon } from '~/components/programs/MaterialIcon'
import { cn } from '~/lib/utils'

interface MaterialChecklistProps {
  moduleId: Id<'programModules'>
  materials: Array<MaterialItem>
  completedIndexes: Set<number>
}

export function MaterialChecklist({
  moduleId,
  materials,
  completedIndexes,
}: MaterialChecklistProps) {
  const [togglingIndex, setTogglingIndex] = useState<number | null>(null)
  const toggleProgress = useMutation(api.programs.toggleMaterialProgress)

  const handleToggle = async (materialIndex: number) => {
    setTogglingIndex(materialIndex)
    try {
      await toggleProgress({ moduleId, materialIndex })
    } catch (error) {
      toast.error('Failed to update progress')
      console.error(error)
    } finally {
      setTogglingIndex(null)
    }
  }

  const completedCount = Math.min(completedIndexes.size, materials.length)
  const totalMinutes = materials.reduce(
    (sum, m) => sum + (m.estimatedMinutes ?? 0),
    0,
  )
  const remainingMinutes = materials.reduce(
    (sum, m, i) =>
      completedIndexes.has(i) ? sum : sum + (m.estimatedMinutes ?? 0),
    0,
  )

  return (
    <div className="space-y-2">
      {materials.map((mat, i) => {
        const isCompleted = completedIndexes.has(i)
        const isToggling = togglingIndex === i

        return (
          <div key={i} className="flex items-center gap-2 group">
            <button
              onClick={() => handleToggle(i)}
              disabled={isToggling}
              className={cn(
                'size-4 rounded border shrink-0 flex items-center justify-center transition-colors',
                isCompleted
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'border-slate-300 hover:border-slate-400',
                isToggling && 'opacity-50',
              )}
            >
              {isCompleted && (
                <svg
                  className="size-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </button>
            <a
              href={mat.url ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'flex items-center gap-1.5 text-sm transition-colors min-w-0',
                isCompleted
                  ? 'text-slate-400 line-through'
                  : 'text-slate-700 hover:text-slate-900',
              )}
            >
              <MaterialIcon type={mat.type} className="size-3.5 shrink-0" />
              <span className="truncate">{mat.label}</span>
              {mat.estimatedMinutes && (
                <span className="text-xs text-slate-400 shrink-0">
                  ~{mat.estimatedMinutes} min
                </span>
              )}
              <ExternalLink className="size-3 text-slate-300 shrink-0 opacity-0 group-hover:opacity-100" />
            </a>
          </div>
        )
      })}

      {materials.length > 0 && (
        <div className="text-xs text-slate-500 pt-1">
          {completedCount}/{materials.length} done
          {totalMinutes > 0 && remainingMinutes > 0 && (
            <> · ~{remainingMinutes} min remaining</>
          )}
          {totalMinutes > 0 &&
            remainingMinutes === 0 &&
            completedCount === materials.length && <> · All done!</>}
        </div>
      )}
    </div>
  )
}
