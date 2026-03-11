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
  continueHereIndex?: number
}

export function MaterialChecklist({
  moduleId,
  materials,
  completedIndexes,
  continueHereIndex,
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

  const essentialMaterials = materials.filter((m) => m.isEssential !== false)
  const essentialCompleted = essentialMaterials.filter((m) => {
    const idx = materials.indexOf(m)
    return completedIndexes.has(idx)
  }).length

  const remainingMinutes = materials.reduce((sum, m, i) => {
    if (m.isEssential === false) return sum
    return completedIndexes.has(i) ? sum : sum + (m.estimatedMinutes ?? 0)
  }, 0)
  const totalMinutes = essentialMaterials.reduce(
    (sum, m) => sum + (m.estimatedMinutes ?? 0),
    0,
  )

  return (
    <div className="space-y-2">
      {materials.map((mat, i) => {
        const isCompleted = completedIndexes.has(i)
        const isToggling = togglingIndex === i
        const isContinueHere = continueHereIndex === i

        return (
          <div
            key={i}
            className={cn(
              'flex items-start gap-2 group',
              isContinueHere && 'border-l-2 border-blue-500 pl-2',
            )}
          >
            <button
              onClick={() => handleToggle(i)}
              disabled={isToggling}
              className={cn(
                'size-4 rounded border shrink-0 flex items-center justify-center transition-colors mt-0.5',
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
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                {mat.type === 'audio' && mat.audioUrl ? (
                  <span
                    className={cn(
                      'flex items-center gap-1.5 text-sm',
                      isCompleted
                        ? 'text-slate-400 line-through'
                        : 'text-slate-700',
                    )}
                  >
                    <MaterialIcon
                      type={mat.type}
                      className="size-3.5 shrink-0"
                    />
                    <span className="truncate">{mat.label}</span>
                  </span>
                ) : (
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
                    <MaterialIcon
                      type={mat.type}
                      className="size-3.5 shrink-0"
                    />
                    <span className="truncate">{mat.label}</span>
                    <ExternalLink className="size-3 text-slate-300 shrink-0 opacity-0 group-hover:opacity-100" />
                  </a>
                )}
                {mat.estimatedMinutes && (
                  <span className="text-xs text-slate-400 shrink-0">
                    ~{mat.estimatedMinutes} min
                  </span>
                )}
                {mat.isEssential === false && (
                  <span className="text-xs text-slate-400">(optional)</span>
                )}
                {isContinueHere && (
                  <span className="text-xs text-blue-600 bg-blue-50 rounded px-1.5 py-0.5">
                    Continue here
                  </span>
                )}
              </div>
              {mat.type === 'audio' && mat.audioUrl && (
                <audio
                  controls
                  preload="none"
                  src={mat.audioUrl}
                  className="w-full mt-1 h-8"
                />
              )}
              {mat.type === 'audio' && !mat.audioUrl && (
                <span className="text-xs text-slate-400 italic">
                  (audio unavailable)
                </span>
              )}
            </div>
          </div>
        )
      })}

      {materials.length > 0 && (
        <div className="text-xs text-slate-500 pt-1">
          {essentialCompleted}/{essentialMaterials.length} done
          {totalMinutes > 0 && remainingMinutes > 0 && (
            <> · ~{remainingMinutes} min remaining</>
          )}
          {totalMinutes > 0 &&
            remainingMinutes === 0 &&
            essentialCompleted === essentialMaterials.length && (
              <> · All done!</>
            )}
        </div>
      )}
    </div>
  )
}
