import { useMutation, useQuery } from 'convex/react'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Pencil,
  Search,
  X,
} from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Spinner } from '~/components/ui/spinner'

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

export function CrmTable({ orgId, collection }: CrmTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>(null)
  const [editingCell, setEditingCell] = useState<{
    id: string
    field: string
  } | null>(null)
  const [editValue, setEditValue] = useState('')

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

  // Apply client-side sort
  const data = useMemo(() => {
    if (!rawData || !sortKey || !sortDir) return rawData
    return [...rawData].sort((a: any, b: any) => {
      const aVal = (a[sortKey] ?? '').toString().toLowerCase()
      const bVal = (b[sortKey] ?? '').toString().toLowerCase()
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [rawData, sortKey, sortDir])

  // For formularios, dynamically extract column keys from datos
  const columns = useMemo(() => {
    if (collection !== 'formularios') return COLUMN_CONFIG[collection]
    const base = COLUMN_CONFIG.formularios
    if (!data || data.length === 0) return base

    // Extract unique keys from datos across all records
    const datosKeys = new Set<string>()
    for (const record of data as any[]) {
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
  }, [collection, data])

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
    try {
      if (collection === 'personas') {
        await updatePersona({
          id: id as Id<'crmPersonas'>,
          field,
          value: editValue,
        })
      } else if (collection === 'organizaciones') {
        await updateOrganizacion({
          id: id as Id<'crmOrganizaciones'>,
          field,
          value: editValue,
        })
      } else if (collection === 'oportunidades') {
        await updateOportunidad({
          id: id as Id<'crmOportunidades'>,
          field,
          value: editValue,
        })
      }
    } catch (err) {
      console.error('Failed to save:', err)
    }
    setEditingCell(null)
  }, [
    editingCell,
    editValue,
    collection,
    updatePersona,
    updateOrganizacion,
    updateOportunidad,
  ])

  const handleCancelEdit = useCallback(() => {
    setEditingCell(null)
  }, [])

  const getCellValue = (record: any, key: string): string => {
    if (key.startsWith('datos.')) {
      const datosKey = key.slice(6)
      const val = record.datos?.[datosKey]
      return val != null ? String(val) : ''
    }
    const val = record[key]
    if (val === true) return 'Sí'
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
      {/* Search bar */}
      {collection !== 'formularios' && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${collection}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
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
            </tr>
          </thead>
          <tbody className="divide-y">
            {records.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center py-12 text-muted-foreground"
                >
                  No records yet. Import data to get started.
                </td>
              </tr>
            ) : (
              records.map((record: any) => (
                <tr key={record._id} className="hover:bg-muted/30">
                  {columns.map((col) => {
                    const isEditing =
                      editingCell?.id === record._id &&
                      editingCell?.field === col.key
                    const cellValue = getCellValue(record, col.key)

                    return (
                      <td
                        key={col.key}
                        className="px-3 py-2 max-w-[250px] group relative"
                      >
                        {isEditing ? (
                          <div className="flex items-center gap-1">
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
                            <span className="truncate" title={cellValue}>
                              {cellValue || (
                                <span className="text-muted-foreground/50">
                                  —
                                </span>
                              )}
                            </span>
                            {isEditable && !col.key.startsWith('datos.') && (
                              <button
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
