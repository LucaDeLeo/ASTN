import { useMutation } from 'convex/react'
import { FileUp, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'

type TargetCollection =
  | 'personas'
  | 'organizaciones'
  | 'oportunidades'
  | 'formularios'

// Convex rejects field names with accents, spaces, or control chars.
// Normalize Excel headers to safe camelCase keys.
function normalizeKey(key: string): string {
  const stripped = key
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, '')
    .trim()
  if (!stripped) return '_empty'
  const parts = stripped.split(/\s+/)
  return parts
    .map((word, i) =>
      i === 0
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join('')
}

function normalizeRow(row: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {}
  for (const [key, value] of Object.entries(row)) {
    out[normalizeKey(key)] = value
  }
  return out
}

interface CrmImportDialogProps {
  orgId: Id<'organizations'>
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface SheetPreview {
  name: string
  headers: string[]
  rowCount: number
  rows: Record<string, any>[]
}

type ImportStatus =
  | 'idle'
  | 'parsing'
  | 'previewing'
  | 'importing'
  | 'done'
  | 'error'

export function CrmImportDialog({
  orgId,
  open,
  onOpenChange,
}: CrmImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<ImportStatus>('idle')
  const [sheets, setSheets] = useState<SheetPreview[]>([])
  const [sheetMappings, setSheetMappings] = useState<
    Record<string, TargetCollection | ''>
  >({})
  const [importResults, setImportResults] = useState<
    { sheet: string; count: number; collection: string }[]
  >([])
  const [errorMsg, setErrorMsg] = useState('')

  const insertPersonas = useMutation(api.crm.insertPersonas)
  const insertOrganizaciones = useMutation(api.crm.insertOrganizaciones)
  const insertOportunidades = useMutation(api.crm.insertOportunidades)
  const insertFormularios = useMutation(api.crm.insertFormularios)

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      setStatus('parsing')
      setErrorMsg('')

      try {
        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer, { type: 'array' })

        const parsedSheets: SheetPreview[] = workbook.SheetNames.map((name) => {
          const sheet = workbook.Sheets[name]
          const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet)
          const headers = rows.length > 0 ? Object.keys(rows[0]) : []

          return {
            name,
            headers,
            rowCount: rows.length,
            rows,
          }
        })

        setSheets(parsedSheets)

        // Auto-map sheets by name
        const autoMappings: Record<string, TargetCollection | ''> = {}
        for (const sheet of parsedSheets) {
          const lower = sheet.name.toLowerCase()
          if (lower.includes('persona') || lower.includes('contact'))
            autoMappings[sheet.name] = 'personas'
          else if (lower.includes('organiza') || lower.includes('org'))
            autoMappings[sheet.name] = 'organizaciones'
          else if (
            lower.includes('oportunid') ||
            lower.includes('opportunit') ||
            lower.includes('job')
          )
            autoMappings[sheet.name] = 'oportunidades'
          else if (
            lower.includes('formulari') ||
            lower.includes('form') ||
            lower.includes('survey')
          )
            autoMappings[sheet.name] = 'formularios'
          else autoMappings[sheet.name] = ''
        }
        setSheetMappings(autoMappings)
        setStatus('previewing')
      } catch (err) {
        console.error('Parse error:', err)
        setErrorMsg(
          'Failed to parse file. Make sure it is a valid Excel or CSV file.',
        )
        setStatus('error')
      }
    },
    [],
  )

  const handleImport = useCallback(async () => {
    setStatus('importing')
    setErrorMsg('')
    const results: { sheet: string; count: number; collection: string }[] = []

    try {
      for (const sheet of sheets) {
        const target = sheetMappings[sheet.name]
        if (!target) continue

        // Convex mutations have a size limit, so batch in chunks of 50
        const BATCH_SIZE = 50
        let totalInserted = 0

        for (let i = 0; i < sheet.rows.length; i += BATCH_SIZE) {
          const batch = sheet.rows.slice(i, i + BATCH_SIZE).map(normalizeRow)

          switch (target) {
            case 'personas':
              totalInserted += await insertPersonas({
                orgId,
                records: batch,
              })
              break
            case 'organizaciones':
              totalInserted += await insertOrganizaciones({
                orgId,
                records: batch,
              })
              break
            case 'oportunidades':
              totalInserted += await insertOportunidades({
                orgId,
                records: batch,
              })
              break
            case 'formularios':
              totalInserted += await insertFormularios({
                orgId,
                records: batch,
              })
              break
          }
        }

        results.push({
          sheet: sheet.name,
          count: totalInserted,
          collection: target,
        })
      }

      setImportResults(results)
      setStatus('done')
    } catch (err: any) {
      console.error('Import error:', err)
      setErrorMsg(err.message || 'Import failed')
      setStatus('error')
    }
  }, [
    sheets,
    sheetMappings,
    orgId,
    insertPersonas,
    insertOrganizaciones,
    insertOportunidades,
    insertFormularios,
  ])

  const handleReset = useCallback(() => {
    setStatus('idle')
    setSheets([])
    setSheetMappings({})
    setImportResults([])
    setErrorMsg('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const mappedSheetCount = Object.values(sheetMappings).filter(Boolean).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Excel / CSV</DialogTitle>
        </DialogHeader>

        {status === 'idle' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload an Excel (.xlsx) or CSV file. Each sheet will be mapped to
              a CRM collection (Personas, Organizaciones, Oportunidades, or
              Formularios).
            </p>
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileUp className="size-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium">Click to select file</p>
              <p className="text-sm text-muted-foreground mt-1">
                .xlsx, .xls, or .csv
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        )}

        {status === 'parsing' && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
            <span className="ml-3 text-muted-foreground">Parsing file...</span>
          </div>
        )}

        {status === 'previewing' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Found {sheets.length} sheet(s). Map each one to a CRM collection:
            </p>

            {sheets.map((sheet) => (
              <div
                key={sheet.name}
                className="flex items-center gap-3 p-3 border rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{sheet.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {sheet.rowCount} rows &middot;{' '}
                    {sheet.headers.slice(0, 4).join(', ')}
                    {sheet.headers.length > 4
                      ? ` +${sheet.headers.length - 4} more`
                      : ''}
                  </p>
                </div>
                <Select
                  value={sheetMappings[sheet.name] || 'skip'}
                  onValueChange={(v) =>
                    setSheetMappings((prev) => ({
                      ...prev,
                      [sheet.name]: v === 'skip' ? '' : (v as TargetCollection),
                    }))
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="skip">Skip</SelectItem>
                    <SelectItem value="personas">Personas</SelectItem>
                    <SelectItem value="organizaciones">
                      Organizaciones
                    </SelectItem>
                    <SelectItem value="oportunidades">Oportunidades</SelectItem>
                    <SelectItem value="formularios">Formularios</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={handleReset}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={mappedSheetCount === 0}>
                Import {mappedSheetCount} sheet(s)
              </Button>
            </div>
          </div>
        )}

        {status === 'importing' && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
            <span className="ml-3 text-muted-foreground">
              Importing records...
            </span>
          </div>
        )}

        {status === 'done' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="size-5" />
              <span className="font-medium">Import complete!</span>
            </div>
            {importResults.map((r) => (
              <p key={r.sheet} className="text-sm text-muted-foreground">
                <span className="font-medium">{r.sheet}</span>: {r.count}{' '}
                records imported to {r.collection}
              </p>
            ))}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={handleReset}>
                Import another file
              </Button>
              <Button onClick={() => onOpenChange(false)}>Done</Button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="size-5" />
              <span className="font-medium">Error</span>
            </div>
            <p className="text-sm text-muted-foreground">{errorMsg}</p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={handleReset}>
                Try again
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
