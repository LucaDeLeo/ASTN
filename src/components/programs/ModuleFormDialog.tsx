import { useMutation } from 'convex/react'
import { Plus, Upload, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import type { MaterialItem } from '~/lib/program-constants'
import { MaterialIcon } from '~/components/programs/MaterialIcon'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Textarea } from '~/components/ui/textarea'
import { Spinner } from '~/components/ui/spinner'

type ModuleStatus = 'locked' | 'available' | 'completed'

interface SessionOption {
  _id: Id<'programSessions'>
  dayNumber: number
  title: string
}

interface ModuleFormDialogProps {
  programId: Id<'programs'>
  module?: {
    _id: Id<'programModules'>
    title: string
    description?: string
    weekNumber: number
    linkedSessionId?: Id<'programSessions'>
    materials?: Array<MaterialItem>
    status: ModuleStatus
  }
  sessions?: Array<SessionOption>
  onSuccess?: () => void
  trigger?: React.ReactNode
}

export function ModuleFormDialog({
  programId,
  module,
  sessions = [],
  onSuccess,
  trigger,
}: ModuleFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [title, setTitle] = useState(module?.title ?? '')
  const [description, setDescription] = useState(module?.description ?? '')
  const [weekNumber, setWeekNumber] = useState(
    module?.weekNumber.toString() ?? '1',
  )
  const [status, setStatus] = useState<ModuleStatus>(module?.status ?? 'locked')
  const [linkedSessionId, setLinkedSessionId] = useState<string>(
    module?.linkedSessionId ?? 'none',
  )
  const [materials, setMaterials] = useState<Array<MaterialItem>>(
    module?.materials ?? [],
  )

  const createModule = useMutation(api.programs.createModule)
  const updateModule = useMutation(api.programs.updateModule)
  const generateUploadUrl = useMutation(api.upload.generateUploadUrl)
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)
  const fileInputRefs = useRef<Map<number, HTMLInputElement>>(new Map())

  const isEditing = Boolean(module)

  const resetForm = () => {
    if (!isEditing) {
      setTitle('')
      setDescription('')
      setWeekNumber('1')
      setStatus('locked')
      setLinkedSessionId('none')
      setMaterials([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsSubmitting(true)
    try {
      const validMaterials = materials
        .filter((m) => m.label.trim() && (m.url?.trim() || m.storageId))
        .map(({ audioUrl: _audioUrl, ...m }) => ({
          ...m,
          storageId: m.storageId ? (m.storageId as Id<'_storage'>) : undefined,
        }))

      const sessionId =
        linkedSessionId !== 'none'
          ? (linkedSessionId as Id<'programSessions'>)
          : undefined

      if (module) {
        await updateModule({
          moduleId: module._id,
          title: title.trim(),
          description: description.trim() || undefined,
          weekNumber: parseInt(weekNumber),
          status,
          linkedSessionId: sessionId,
          materials: validMaterials.length > 0 ? validMaterials : undefined,
        })
        toast.success('Module updated')
      } else {
        await createModule({
          programId,
          title: title.trim(),
          description: description.trim() || undefined,
          weekNumber: parseInt(weekNumber),
          status,
          linkedSessionId: sessionId,
          materials: validMaterials.length > 0 ? validMaterials : undefined,
        })
        toast.success('Module created')
        resetForm()
      }
      setOpen(false)
      onSuccess?.()
    } catch (error) {
      toast.error(
        isEditing ? 'Failed to update module' : 'Failed to create module',
      )
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const addMaterial = () => {
    setMaterials([...materials, { label: '', url: '', type: 'link' as const }])
  }

  const handleAudioUpload = async (index: number, file: File) => {
    if (!file.type.startsWith('audio/')) {
      toast.error('Please select an audio file')
      return
    }
    setUploadingIndex(index)
    try {
      const url = await generateUploadUrl()
      const result = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      const { storageId } = await result.json()
      const updated = [...materials]
      updated[index] = {
        ...updated[index],
        storageId,
        url: undefined,
        label: updated[index].label || file.name.replace(/\.[^.]+$/, ''),
      }
      setMaterials(updated)
      toast.success('Audio uploaded')
    } catch {
      toast.error('Failed to upload audio')
    } finally {
      setUploadingIndex(null)
    }
  }

  const removeMaterial = (index: number) => {
    setMaterials(materials.filter((_, i) => i !== index))
  }

  const updateMaterial = (
    index: number,
    field: keyof MaterialItem,
    value: string | number | boolean | undefined,
  ) => {
    const updated = [...materials]
    updated[index] = { ...updated[index], [field]: value }
    // When switching away from audio, clear storageId
    if (field === 'type' && value !== 'audio' && updated[index].storageId) {
      updated[index] = { ...updated[index], storageId: undefined }
    }
    setMaterials(updated)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (v && module) {
          setTitle(module.title)
          setDescription(module.description ?? '')
          setWeekNumber(module.weekNumber.toString())
          setStatus(module.status)
          setLinkedSessionId(module.linkedSessionId ?? 'none')
          setMaterials(module.materials ?? [])
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="size-4 mr-1" />
            Add Module
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Module' : 'Add Module'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Week 1: Introduction to AI Safety"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Module description (supports Markdown)"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Week Number
              </label>
              <Input
                type="number"
                min="1"
                value={weekNumber}
                onChange={(e) => setWeekNumber(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Status
              </label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as ModuleStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="locked">Locked</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {sessions.length > 0 && (
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Linked Session
              </label>
              <Select
                value={linkedSessionId}
                onValueChange={setLinkedSessionId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {sessions.map((s) => (
                    <SelectItem key={s._id} value={s._id}>
                      Day {s.dayNumber}: {s.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-foreground">
                Materials
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addMaterial}
              >
                <Plus className="size-3 mr-1" />
                Add
              </Button>
            </div>
            {materials.length === 0 ? (
              <p className="text-sm text-slate-500">No materials added yet</p>
            ) : (
              <div className="space-y-3">
                {materials.map((mat, i) => (
                  <div
                    key={i}
                    className="border rounded-lg p-3 space-y-2 relative"
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-1 right-1 size-6 p-0"
                      onClick={() => removeMaterial(i)}
                    >
                      <X className="size-3.5" />
                    </Button>
                    <div className="grid grid-cols-[1fr,auto] gap-2">
                      <Input
                        placeholder="Label"
                        value={mat.label}
                        onChange={(e) =>
                          updateMaterial(i, 'label', e.target.value)
                        }
                      />
                      <Select
                        value={mat.type}
                        onValueChange={(v) => updateMaterial(i, 'type', v)}
                      >
                        <SelectTrigger className="w-28">
                          <div className="flex items-center gap-1.5">
                            <MaterialIcon
                              type={mat.type}
                              className="size-3.5"
                            />
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="link">Link</SelectItem>
                          <SelectItem value="pdf">PDF</SelectItem>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="reading">Reading</SelectItem>
                          <SelectItem value="audio">Audio</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-[1fr,auto] gap-2">
                      {mat.type === 'audio' ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            accept="audio/*"
                            className="hidden"
                            ref={(el) => {
                              if (el) fileInputRefs.current.set(i, el)
                            }}
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleAudioUpload(i, file)
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="shrink-0"
                            disabled={uploadingIndex === i}
                            onClick={() =>
                              fileInputRefs.current.get(i)?.click()
                            }
                          >
                            {uploadingIndex === i ? (
                              <Spinner className="size-3.5 mr-1" />
                            ) : (
                              <Upload className="size-3.5 mr-1" />
                            )}
                            {mat.storageId ? 'Replace' : 'Upload'}
                          </Button>
                          {mat.storageId && (
                            <span className="text-xs text-green-600">
                              Audio uploaded
                            </span>
                          )}
                        </div>
                      ) : (
                        <Input
                          placeholder="URL"
                          value={mat.url ?? ''}
                          onChange={(e) =>
                            updateMaterial(i, 'url', e.target.value)
                          }
                        />
                      )}
                      <Input
                        type="number"
                        min="0"
                        placeholder="Min"
                        className="w-20"
                        value={mat.estimatedMinutes ?? ''}
                        onChange={(e) =>
                          updateMaterial(
                            i,
                            'estimatedMinutes',
                            e.target.value
                              ? parseInt(e.target.value)
                              : undefined,
                          )
                        }
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
                        onClick={() =>
                          updateMaterial(
                            i,
                            'isEssential',
                            mat.isEssential === false ? undefined : false,
                          )
                        }
                      >
                        {mat.isEssential === false ? (
                          <span className="text-slate-400">Optional</span>
                        ) : (
                          <span className="text-slate-600 font-medium">
                            Essential
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !title.trim()}>
              {isSubmitting ? <Spinner className="size-4 mr-1" /> : null}
              {isEditing ? 'Save Changes' : 'Create Module'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
