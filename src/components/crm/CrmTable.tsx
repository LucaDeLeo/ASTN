import { useMutation, useQuery } from 'convex/react'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Columns3,
  EyeOff,
  Filter,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  View,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import { Spinner } from '~/components/ui/spinner'
import { Textarea } from '~/components/ui/textarea'

type Collection =
  | 'personas'
  | 'organizaciones'
  | 'oportunidades'
  | 'formularios'

// Columns config per collection — order determines display order
const COLUMN_CONFIG: Record<Collection, { key: string; label: string }[]> = {
  personas: [
    { key: 'nombre', label: 'Nombre' },
    { key: 'email', label: 'Email' },
    { key: 'telefono', label: 'Teléfono' },
    { key: 'vinculo', label: 'Vínculo' },
    { key: 'rol', label: 'Rol' },
    { key: 'cargo', label: 'Cargo' },
    { key: 'campoProfesional', label: 'Campo profesional' },
    { key: 'etapaProfesional', label: 'Etapa profesional' },
    { key: 'experienciaAiSafety', label: 'Exp. AI Safety' },
    { key: 'habilidades', label: 'Habilidades' },
    { key: 'intereses', label: 'Intereses' },
    { key: 'disponibilidad', label: 'Disponibilidad' },
    { key: 'ubicacion', label: 'Ubicación' },
    { key: 'linkedin', label: 'LinkedIn' },
    { key: 'organizacionesAsociadas', label: 'Orgs asociadas' },
    { key: 'participoEn', label: 'Participó en' },
    { key: 'notas', label: 'Notas' },
  ],
  organizaciones: [
    { key: 'nombre', label: 'Nombre' },
    { key: 'descripcion', label: 'Descripción' },
    { key: 'personasClave', label: 'Personas clave' },
    { key: 'tipo', label: 'Tipo' },
    { key: 'posturaIA', label: 'Postura IA' },
    { key: 'tematicaPrincipal', label: 'Temática principal' },
    { key: 'notas', label: 'Notas' },
    { key: 'resumenAuto', label: 'Resumen' },
  ],
  oportunidades: [
    { key: 'titulo', label: 'Título' },
    { key: 'organizacion', label: 'Organización' },
    { key: 'ubicacion', label: 'Ubicación' },
    { key: 'tipo', label: 'Tipo' },
    { key: 'categoria', label: 'Categoría' },
    { key: 'fecha', label: 'Fecha' },
    { key: 'estado', label: 'Estado' },
    { key: 'fuente', label: 'Fuente' },
  ],
  formularios: [
    { key: 'participante', label: 'Participante' },
    { key: 'periodo', label: 'Período' },
    { key: 'fuente', label: 'Fuente' },
  ],
}

interface CrmTableProps {
  orgId: Id<'organizations'>
  collection: Collection
}

type SortDir = 'asc' | 'desc' | null

interface SavedView {
  id: string
  name: string
  hiddenColumns: string[]
  filters: Record<string, string>
  sortKey: string | null
  sortDir: SortDir
}

const viewsStorageKey = (orgId: string, collection: Collection) =>
  `crm-views:${orgId}:${collection}`

export function CrmTable({ orgId, collection }: CrmTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>(null)
  const [editingCell, setEditingCell] = useState<{
    id: string
    field: string
  } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([])
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [showFilters, setShowFilters] = useState(false)
  const [savedViews, setSavedViews] = useState<SavedView[]>([])
  const [activeViewId, setActiveViewId] = useState<string | null>(null)
  const [saveViewDialogOpen, setSaveViewDialogOpen] = useState(false)
  const [newViewName, setNewViewName] = useState('')

  // Load saved views from localStorage on mount / collection change.
  // Wrap the read in try/catch — getItem itself can throw in restricted
  // browsing modes (private, sandboxed iframes), not just JSON.parse.
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem(viewsStorageKey(orgId, collection))
      setSavedViews(raw ? JSON.parse(raw) : [])
    } catch (err) {
      console.error('Failed to load saved views:', err)
      setSavedViews([])
    }
    setActiveViewId(null)
    setHiddenColumns([])
    setFilters({})
  }, [orgId, collection])

  const persistViews = useCallback(
    (views: SavedView[]) => {
      // Always update in-memory state. localStorage may fail (quota exceeded,
      // private mode, etc.) but the user's current session shouldn't break.
      setSavedViews(views)
      try {
        localStorage.setItem(
          viewsStorageKey(orgId, collection),
          JSON.stringify(views),
        )
      } catch (err) {
        console.error('Failed to persist views:', err)
        toast.error('Could not save view (storage full?)')
      }
    },
    [orgId, collection],
  )

  const applyView = useCallback((view: SavedView) => {
    setHiddenColumns(view.hiddenColumns)
    setFilters(view.filters)
    setSortKey(view.sortKey)
    setSortDir(view.sortDir)
    setActiveViewId(view.id)
  }, [])

  const resetView = useCallback(() => {
    setHiddenColumns([])
    setFilters({})
    setSortKey(null)
    setSortDir(null)
    setActiveViewId(null)
  }, [])

  const openSaveViewDialog = useCallback(() => {
    setNewViewName('')
    setSaveViewDialogOpen(true)
  }, [])

  const confirmSaveView = useCallback(() => {
    const name = newViewName.trim()
    if (!name) return
    const newView: SavedView = {
      id: Math.random().toString(36).slice(2, 10),
      name,
      hiddenColumns,
      filters,
      sortKey,
      sortDir,
    }
    persistViews([...savedViews, newView])
    setActiveViewId(newView.id)
    setSaveViewDialogOpen(false)
    setNewViewName('')
  }, [
    newViewName,
    hiddenColumns,
    filters,
    sortKey,
    sortDir,
    savedViews,
    persistViews,
  ])

  const deleteView = useCallback(
    (id: string) => {
      persistViews(savedViews.filter((v) => v.id !== id))
      if (activeViewId === id) setActiveViewId(null)
    },
    [savedViews, activeViewId, persistViews],
  )

  const toggleColumn = useCallback((key: string) => {
    setHiddenColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    )
  }, [])

  // Queries — pick the right one based on collection
  const personas = useQuery(
    api.crm.listPersonas,
    collection === 'personas'
      ? { orgId, searchQuery: searchQuery || undefined }
      : 'skip',
  )
  const organizaciones = useQuery(
    api.crm.listOrganizaciones,
    collection === 'organizaciones'
      ? { orgId, searchQuery: searchQuery || undefined }
      : 'skip',
  )
  const oportunidades = useQuery(
    api.crm.listOportunidades,
    collection === 'oportunidades'
      ? { orgId, searchQuery: searchQuery || undefined }
      : 'skip',
  )
  const formularios = useQuery(
    api.crm.listFormularios,
    collection === 'formularios' ? { orgId } : 'skip',
  )

  // Mutations
  const updatePersona = useMutation(api.crm.updatePersona)
  const updateOrganizacion = useMutation(api.crm.updateOrganizacion)
  const updateOportunidad = useMutation(api.crm.updateOportunidad)
  const createEmptyPersona = useMutation(api.crm.createEmptyPersona)
  const createEmptyOrganizacion = useMutation(api.crm.createEmptyOrganizacion)
  const createEmptyOportunidad = useMutation(api.crm.createEmptyOportunidad)
  const deletePersona = useMutation(api.crm.deletePersona)
  const deleteOrganizacion = useMutation(api.crm.deleteOrganizacion)
  const deleteOportunidad = useMutation(api.crm.deleteOportunidad)

  const rawData = useMemo(() => {
    switch (collection) {
      case 'personas':
        return personas
      case 'organizaciones':
        return organizaciones
      case 'oportunidades':
        return oportunidades
      case 'formularios':
        return formularios
      default:
        return null
    }
  }, [collection, personas, organizaciones, oportunidades, formularios])

  // Apply client-side filters + sort
  const data = useMemo(() => {
    if (!rawData) return rawData
    let result = rawData as any[]

    const activeFilters = Object.entries(filters).filter(([, v]) => v.trim())
    if (activeFilters.length > 0) {
      result = result.filter((record) =>
        activeFilters.every(([field, needle]) => {
          const value = field.startsWith('datos.')
            ? record.datos?.[field.slice(6)]
            : record[field]
          if (value == null) return false
          return String(value).toLowerCase().includes(needle.toLowerCase())
        }),
      )
    }

    if (sortKey && sortDir) {
      const dir = sortDir === 'asc' ? 1 : -1
      // Resolve nested `datos.*` keys the same way the filter / cell-render
      // paths do, otherwise sort on dynamic formulario columns no-ops.
      const resolve = (record: any) =>
        sortKey.startsWith('datos.')
          ? record.datos?.[sortKey.slice(6)]
          : record[sortKey]
      result = [...result].sort((a: any, b: any) => {
        const aRaw = resolve(a)
        const bRaw = resolve(b)
        // Push null/empty to the bottom regardless of direction
        const aEmpty = aRaw == null || aRaw === ''
        const bEmpty = bRaw == null || bRaw === ''
        if (aEmpty && bEmpty) return 0
        if (aEmpty) return 1
        if (bEmpty) return -1
        // Try numeric
        const aNum = Number(aRaw)
        const bNum = Number(bRaw)
        if (Number.isFinite(aNum) && Number.isFinite(bNum)) {
          return (aNum - bNum) * dir
        }
        // Try date
        const aDate = Date.parse(String(aRaw))
        const bDate = Date.parse(String(bRaw))
        if (!isNaN(aDate) && !isNaN(bDate)) {
          return (aDate - bDate) * dir
        }
        // Fallback: locale-aware string compare
        return String(aRaw).localeCompare(String(bRaw)) * dir
      })
    }
    return result
  }, [rawData, sortKey, sortDir, filters])

  // For formularios, dynamically extract column keys from datos.
  // Derive from `rawData` (not the filtered `data`) so columns stay stable
  // when filters are applied — otherwise a filter that yields zero rows
  // would collapse the column list and lose any saved view's selection.
  const allColumns = useMemo(() => {
    if (collection !== 'formularios') return COLUMN_CONFIG[collection]
    const base = COLUMN_CONFIG.formularios
    if (!rawData || (rawData as any[]).length === 0) return base

    const datosKeys = new Set<string>()
    for (const record of rawData as any[]) {
      if (record.datos) {
        for (const key of Object.keys(record.datos)) {
          datosKeys.add(key)
        }
      }
    }
    const extraCols = Array.from(datosKeys)
      .sort()
      .map((key) => ({ key: `datos.${key}`, label: key }))

    return [...base, ...extraCols]
  }, [collection, rawData])

  const columns = useMemo(
    () => allColumns.filter((col) => !hiddenColumns.includes(col.key)),
    [allColumns, hiddenColumns],
  )

  // Auto-generated views for Formularios, one per distinct `fuente`.
  // Ordered by "recency": parses the most-recent `periodo` of each fuente
  // (format "1c2025", "2c2024", etc.) → year*10+semester. Falls back to
  // parsing the fuente name itself, then to timestamp.
  const distinctFuentes = useMemo(() => {
    if (collection !== 'formularios' || !rawData) return []
    const parsePeriodo = (s: string | undefined): number => {
      if (!s) return 0
      const m = s.match(/(\d)\s*c\s*(\d{4})/i)
      if (m) return parseInt(m[2], 10) * 10 + parseInt(m[1], 10)
      const year = s.match(/(\d{4})/)
      return year ? parseInt(year[1], 10) * 10 : 0
    }
    const rankByFuente = new Map<string, number>()
    const tsByFuente = new Map<string, number>()
    for (const r of rawData as any[]) {
      if (!r.fuente || typeof r.fuente !== 'string') continue
      const rank = Math.max(parsePeriodo(r.periodo), parsePeriodo(r.fuente))
      const prev = rankByFuente.get(r.fuente) ?? 0
      if (rank > prev) rankByFuente.set(r.fuente, rank)
      const ts = r.createdAt ?? r._creationTime ?? 0
      const prevTs = tsByFuente.get(r.fuente) ?? 0
      if (ts > prevTs) tsByFuente.set(r.fuente, ts)
    }
    const fuentes = Array.from(rankByFuente.keys())
    fuentes.sort((a, b) => {
      const ra = rankByFuente.get(a) ?? 0
      const rb = rankByFuente.get(b) ?? 0
      if (rb !== ra) return rb - ra
      const ta = tsByFuente.get(a) ?? 0
      const tb = tsByFuente.get(b) ?? 0
      if (tb !== ta) return tb - ta
      return a.localeCompare(b)
    })
    return fuentes
  }, [collection, rawData])

  const applyFuenteView = useCallback(
    (fuenteValue: string) => {
      if (!rawData) return
      const filtered = (rawData as any[]).filter(
        (r) => r.fuente === fuenteValue,
      )
      const emptyKeys = allColumns
        .filter((col) => {
          return !filtered.some((record) => {
            const val = col.key.startsWith('datos.')
              ? record.datos?.[col.key.slice(6)]
              : record[col.key]
            return val != null && val !== ''
          })
        })
        .map((c) => c.key)
      setFilters({ fuente: fuenteValue })
      setHiddenColumns(emptyKeys)
      setSortKey(null)
      setSortDir(null)
      setActiveViewId(`auto-fuente-${fuenteValue}`)
    },
    [rawData, allColumns],
  )

  const hideEmptyColumns = useCallback(() => {
    if (!data || (data as any[]).length === 0) return
    const emptyKeys = allColumns
      .filter((col) => {
        return !(data as any[]).some((record) => {
          const val = col.key.startsWith('datos.')
            ? record.datos?.[col.key.slice(6)]
            : record[col.key]
          return val != null && val !== ''
        })
      })
      .map((c) => c.key)
    setHiddenColumns((prev) => Array.from(new Set([...prev, ...emptyKeys])))
  }, [allColumns, data])

  // Distinct values per visible column — for chip-based filter shortcuts.
  // Only show chips if column has a small-to-medium number of distinct values.
  const MAX_DISTINCT_FOR_CHIPS = 20
  const MAX_CHIPS_SHOWN = 12
  const distinctByColumn = useMemo(() => {
    const out: Record<string, { value: string; count: number }[]> = {}
    if (!rawData) return out
    for (const col of columns) {
      const counts = new Map<string, number>()
      for (const record of rawData as any[]) {
        const raw = col.key.startsWith('datos.')
          ? record.datos?.[col.key.slice(6)]
          : record[col.key]
        if (raw == null || raw === '') continue
        const str = String(raw)
        counts.set(str, (counts.get(str) ?? 0) + 1)
      }
      if (counts.size === 0 || counts.size > MAX_DISTINCT_FOR_CHIPS) continue
      out[col.key] = Array.from(counts.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, MAX_CHIPS_SHOWN)
    }
    return out
  }, [rawData, columns])

  const handleSort = useCallback(
    (key: string) => {
      if (sortKey === key) {
        if (sortDir === 'asc') setSortDir('desc')
        else if (sortDir === 'desc') {
          setSortKey(null)
          setSortDir(null)
        }
      } else {
        setSortKey(key)
        setSortDir('asc')
      }
    },
    [sortKey, sortDir],
  )

  const handleStartEdit = useCallback(
    (id: string, field: string, currentValue: string) => {
      setEditingCell({ id, field })
      setEditValue(currentValue ?? '')
    },
    [],
  )

  const handleSaveEdit = useCallback(async () => {
    if (!editingCell) return
    const { id, field } = editingCell
    // Capture previous value for undo
    const record = (rawData as any[] | null | undefined)?.find(
      (r) => r._id === id,
    )
    const previousValue = record ? record[field] : undefined
    const newValue = editValue
    const unchanged = String(previousValue ?? '') === String(newValue ?? '')

    const runUpdate = async (value: any) => {
      if (collection === 'personas') {
        await updatePersona({
          id: id as Id<'crmPersonas'>,
          field,
          value,
        })
      } else if (collection === 'organizaciones') {
        await updateOrganizacion({
          id: id as Id<'crmOrganizaciones'>,
          field,
          value,
        })
      } else if (collection === 'oportunidades') {
        await updateOportunidad({
          id: id as Id<'crmOportunidades'>,
          field,
          value,
        })
      }
    }

    try {
      await runUpdate(newValue)
      if (!unchanged) {
        toast.success('Saved', {
          duration: 6000,
          action: {
            label: 'Undo',
            onClick: () => {
              runUpdate(previousValue).catch((e) =>
                console.error('Undo failed:', e),
              )
            },
          },
        })
      }
    } catch (err) {
      console.error('Failed to save:', err)
      toast.error('Failed to save')
    }
    setEditingCell(null)
  }, [
    editingCell,
    editValue,
    collection,
    rawData,
    updatePersona,
    updateOrganizacion,
    updateOportunidad,
  ])

  const handleCancelEdit = useCallback(() => {
    setEditingCell(null)
  }, [])

  const handleDeleteRow = useCallback(
    async (id: string) => {
      try {
        if (collection === 'personas') {
          await deletePersona({ id: id as Id<'crmPersonas'> })
        } else if (collection === 'organizaciones') {
          await deleteOrganizacion({ id: id as Id<'crmOrganizaciones'> })
        } else if (collection === 'oportunidades') {
          await deleteOportunidad({ id: id as Id<'crmOportunidades'> })
        }
        toast.success('Deleted')
      } catch (err) {
        console.error('Failed to delete:', err)
        toast.error('Failed to delete')
      }
    },
    [collection, deletePersona, deleteOrganizacion, deleteOportunidad],
  )

  const handleAddRow = useCallback(async () => {
    try {
      let newId: string | null = null
      if (collection === 'personas') {
        newId = await createEmptyPersona({ orgId })
      } else if (collection === 'organizaciones') {
        newId = await createEmptyOrganizacion({ orgId })
      } else if (collection === 'oportunidades') {
        newId = await createEmptyOportunidad({ orgId })
      }
      if (newId) {
        const firstField = collection === 'oportunidades' ? 'titulo' : 'nombre'
        const defaultValue =
          collection === 'personas'
            ? 'New person'
            : collection === 'organizaciones'
              ? 'New organization'
              : 'New opportunity'
        setEditingCell({ id: newId, field: firstField })
        setEditValue(defaultValue)
      }
    } catch (err) {
      console.error('Failed to add row:', err)
    }
  }, [
    collection,
    orgId,
    createEmptyPersona,
    createEmptyOrganizacion,
    createEmptyOportunidad,
  ])

  const getCellValue = (record: any, key: string): string => {
    if (key.startsWith('datos.')) {
      const datosKey = key.slice(6)
      const val = record.datos?.[datosKey]
      return val != null ? String(val) : ''
    }
    const val = record[key]
    if (val === true) return 'Yes'
    if (val === false) return 'No'
    return val != null ? String(val) : ''
  }

  if (data === undefined || data === null) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="size-8" />
      </div>
    )
  }

  const records = data as any[]
  const isEditable = collection !== 'formularios'

  return (
    <div className="space-y-4">
      {/* Toolbar: search + views + columns + filter + new row */}
      <div className="flex items-center gap-2 flex-wrap">
        {collection !== 'formularios' && (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${collection}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        )}

        {/* Views dropdown */}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <View className="size-4 mr-1.5" />
              {activeViewId
                ? (savedViews.find((v) => v.id === activeViewId)?.name ??
                  'View')
                : 'Views'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 p-0">
            <div
              className="p-1 max-h-96 overflow-y-auto"
              onWheel={(e) => e.stopPropagation()}
            >
              <DropdownMenuLabel>Saved views</DropdownMenuLabel>
              {savedViews.length === 0 ? (
                <DropdownMenuItem disabled>No saved views</DropdownMenuItem>
              ) : (
                savedViews.map((view) => (
                  <div
                    key={view.id}
                    className="flex items-center justify-between"
                  >
                    <DropdownMenuItem
                      className="flex-1"
                      onClick={() => applyView(view)}
                    >
                      {view.name}
                      {activeViewId === view.id && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          ●
                        </span>
                      )}
                    </DropdownMenuItem>
                    <button
                      type="button"
                      aria-label={`Delete view "${view.name}"`}
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteView(view.id)
                      }}
                      className="px-2 text-muted-foreground hover:text-destructive"
                      title="Delete view"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                ))
              )}
              {distinctFuentes.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>By source (auto)</DropdownMenuLabel>
                  {distinctFuentes.map((fuente) => {
                    const viewId = `auto-fuente-${fuente}`
                    return (
                      <DropdownMenuItem
                        key={fuente}
                        onClick={() => applyFuenteView(fuente)}
                      >
                        <span className="truncate">{fuente}</span>
                        {activeViewId === viewId && (
                          <span className="ml-auto text-xs text-muted-foreground">
                            ●
                          </span>
                        )}
                      </DropdownMenuItem>
                    )
                  })}
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={openSaveViewDialog}>
                <Save className="size-4 mr-2" />
                Save current view
              </DropdownMenuItem>
              <DropdownMenuItem onClick={resetView}>
                <X className="size-4 mr-2" />
                Reset
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Columns visibility */}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Columns3 className="size-4 mr-1.5" />
              Columns
              {hiddenColumns.length > 0 && (
                <span className="ml-1 text-xs text-muted-foreground">
                  ({allColumns.length - hiddenColumns.length}/
                  {allColumns.length})
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-0">
            <div className="p-1">
              <DropdownMenuLabel>Show columns</DropdownMenuLabel>
              <div className="flex gap-1 px-2 pb-1">
                <button
                  onClick={() =>
                    hiddenColumns.length > 0
                      ? setHiddenColumns([])
                      : setHiddenColumns(allColumns.map((c) => c.key))
                  }
                  className="flex-1 text-xs text-muted-foreground hover:text-foreground border rounded px-2 py-1"
                >
                  {hiddenColumns.length > 0 ? 'Show all' : 'Hide all'}
                </button>
                <button
                  onClick={hideEmptyColumns}
                  className="flex-1 text-xs text-muted-foreground hover:text-foreground border rounded px-2 py-1 flex items-center justify-center gap-1"
                  title="Hide columns with no data in visible rows"
                >
                  <EyeOff className="size-3" />
                  Hide empty
                </button>
              </div>
              <DropdownMenuSeparator />
            </div>
            <div
              className="max-h-72 overflow-y-auto px-1 pb-1"
              onWheel={(e) => e.stopPropagation()}
            >
              {allColumns.map((col) => (
                <DropdownMenuItem
                  key={col.key}
                  onSelect={(e) => {
                    e.preventDefault()
                    toggleColumn(col.key)
                  }}
                  className="gap-2"
                >
                  <Checkbox
                    checked={!hiddenColumns.includes(col.key)}
                    onCheckedChange={() => toggleColumn(col.key)}
                  />
                  <span className="truncate">{col.label}</span>
                </DropdownMenuItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Filters toggle */}
        <Button
          variant={showFilters ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowFilters((v) => !v)}
        >
          <Filter className="size-4 mr-1.5" />
          Filters
          {Object.values(filters).filter((v) => v.trim()).length > 0 && (
            <span className="ml-1 text-xs">
              ({Object.values(filters).filter((v) => v.trim()).length})
            </span>
          )}
        </Button>

        {collection !== 'formularios' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleAddRow()}
          >
            <Plus className="size-4 mr-1.5" />
            New row
          </Button>
        )}
      </div>

      {/* Filters panel (compact: only active filters) */}
      {showFilters && (
        <div className="border rounded-lg p-3 bg-muted/30 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="size-3.5 mr-1" />
                  Add filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 p-0">
                <DropdownMenuLabel>Pick column</DropdownMenuLabel>
                <div
                  className="max-h-72 overflow-y-auto p-1"
                  onWheel={(e) => e.stopPropagation()}
                >
                  {columns
                    .filter((c) => !(c.key in filters))
                    .map((col) => (
                      <DropdownMenuItem
                        key={col.key}
                        onSelect={() =>
                          setFilters((prev) => ({ ...prev, [col.key]: '' }))
                        }
                      >
                        <span className="truncate">{col.label}</span>
                      </DropdownMenuItem>
                    ))}
                  {columns.filter((c) => !(c.key in filters)).length === 0 && (
                    <DropdownMenuItem disabled>
                      All columns already filtered
                    </DropdownMenuItem>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {Object.keys(filters).length > 0 && (
              <button
                onClick={() => setFilters({})}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <X className="size-3" />
                Clear all
              </button>
            )}
          </div>

          {Object.keys(filters).length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              No active filters. Click "Add filter" to get started.
            </p>
          ) : (
            <div className="space-y-2">
              {Object.keys(filters).map((key) => {
                const col = allColumns.find((c) => c.key === key)
                if (!col) return null
                const chips = distinctByColumn[key] ?? []
                const currentFilter = filters[key] ?? ''
                return (
                  <div
                    key={key}
                    className="bg-background border rounded-md p-2 space-y-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium w-32 truncate">
                        {col.label}
                      </span>
                      <Input
                        placeholder="contains..."
                        value={currentFilter}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            [key]: e.target.value,
                          }))
                        }
                        className="h-7 text-sm flex-1"
                        autoFocus
                      />
                      <button
                        type="button"
                        aria-label={`Remove filter for ${key}`}
                        onClick={() =>
                          setFilters((prev) => {
                            const next = { ...prev }
                            delete next[key]
                            return next
                          })
                        }
                        className="text-muted-foreground hover:text-destructive"
                        title="Remove filter"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    {chips.length > 0 && (
                      <div className="flex flex-wrap gap-1 pl-[8.5rem]">
                        {chips.map((chip) => {
                          const isActive = currentFilter === chip.value
                          return (
                            <button
                              key={chip.value}
                              onClick={() =>
                                setFilters((prev) => ({
                                  ...prev,
                                  [key]: isActive ? '' : chip.value,
                                }))
                              }
                              className={`text-xs rounded-full px-2 py-0.5 border transition-colors truncate max-w-[14rem] ${
                                isActive
                                  ? 'bg-primary text-primary-foreground border-primary'
                                  : 'bg-background hover:bg-accent text-muted-foreground'
                              }`}
                              title={chip.value}
                            >
                              {chip.value}
                              <span
                                className={`ml-1 ${isActive ? 'opacity-70' : 'opacity-50'}`}
                              >
                                {chip.count}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {records.length} {records.length === 1 ? 'record' : 'records'}
      </p>

      {/* Table */}
      <div className="border rounded-lg overflow-auto max-h-[600px]">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 sticky top-0 z-10">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap cursor-pointer select-none hover:text-foreground transition-colors"
                  onClick={() => handleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {sortKey === col.key ? (
                      sortDir === 'asc' ? (
                        <ArrowUp className="size-3" />
                      ) : (
                        <ArrowDown className="size-3" />
                      )
                    ) : (
                      <ArrowUpDown className="size-3 opacity-30" />
                    )}
                  </div>
                </th>
              ))}
              {isEditable && <th className="w-8" />}
            </tr>
          </thead>
          <tbody className="divide-y">
            {records.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (isEditable ? 1 : 0)}
                  className="text-center py-12 text-muted-foreground"
                >
                  No records yet. Import data to get started.
                </td>
              </tr>
            ) : (
              records.map((record: any) => (
                <tr key={record._id} className="group/row hover:bg-muted/30">
                  {columns.map((col) => {
                    const isEditing =
                      editingCell?.id === record._id &&
                      editingCell?.field === col.key
                    const cellValue = getCellValue(record, col.key)

                    const isLongValue =
                      cellValue.length > 60 || cellValue.includes('\n')

                    return (
                      <td
                        key={col.key}
                        className="px-3 py-2 max-w-[250px] group relative align-top"
                      >
                        {isEditing ? (
                          <div className="flex items-start gap-1">
                            {isLongValue ? (
                              <Textarea
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (
                                    e.key === 'Enter' &&
                                    (e.metaKey || e.ctrlKey)
                                  ) {
                                    e.preventDefault()
                                    void handleSaveEdit()
                                  }
                                  if (e.key === 'Escape') handleCancelEdit()
                                }}
                                className="text-sm min-h-[80px] w-full"
                                autoFocus
                              />
                            ) : (
                              <Input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') void handleSaveEdit()
                                  if (e.key === 'Escape') handleCancelEdit()
                                }}
                                className="h-7 text-sm"
                                autoFocus
                              />
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2"
                              onClick={() => void handleSaveEdit()}
                            >
                              OK
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            {cellValue ? (
                              isLongValue ? (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <button className="truncate text-left hover:text-foreground transition-colors cursor-pointer">
                                      {cellValue}
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent
                                    align="start"
                                    className="w-96 max-h-96 overflow-auto whitespace-pre-wrap text-sm"
                                  >
                                    {cellValue}
                                  </PopoverContent>
                                </Popover>
                              ) : (
                                <span className="truncate" title={cellValue}>
                                  {cellValue}
                                </span>
                              )
                            ) : (
                              <span className="truncate text-muted-foreground/50">
                                —
                              </span>
                            )}
                            {isEditable && !col.key.startsWith('datos.') && (
                              <button
                                type="button"
                                aria-label={`Edit ${col.label}`}
                                onClick={() =>
                                  handleStartEdit(
                                    record._id,
                                    col.key,
                                    cellValue,
                                  )
                                }
                                className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto shrink-0"
                              >
                                <Pencil className="size-3 text-muted-foreground hover:text-foreground" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    )
                  })}
                  {isEditable && (
                    <td className="px-2 text-center align-middle">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            aria-label="Delete row"
                            className="opacity-0 group-hover/row:opacity-100 focus:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1 inline-flex"
                            title="Delete row"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent
                          side="left"
                          align="start"
                          className="w-auto p-2"
                        >
                          <div className="flex items-center gap-2 text-sm">
                            <span>Delete this row?</span>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-7"
                              onClick={() => void handleDeleteRow(record._id)}
                            >
                              Yes
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={saveViewDialogOpen} onOpenChange={setSaveViewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save view</DialogTitle>
          </DialogHeader>
          <Input
            autoFocus
            placeholder="View name"
            value={newViewName}
            onChange={(e) => setNewViewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newViewName.trim()) confirmSaveView()
              if (e.key === 'Escape') setSaveViewDialogOpen(false)
            }}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSaveViewDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={confirmSaveView} disabled={!newViewName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
