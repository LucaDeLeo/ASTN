'use node'

import { v } from 'convex/values'
import { internalAction } from './_generated/server'
import { internal } from './_generated/api'

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Safely extract a string field from an Airtable record. */
function str(
  fields: Record<string, unknown>,
  ...keys: Array<string>
): string | undefined {
  for (const key of keys) {
    const val = fields[key]
    if (typeof val === 'string' && val.length > 0) return val
  }
  return undefined
}

/** Safely extract an array-or-string field as Array<string>. */
function strArray(
  fields: Record<string, unknown>,
  ...keys: Array<string>
): Array<string> {
  for (const key of keys) {
    const val = fields[key]
    if (Array.isArray(val)) return val.map((i) => String(i))
    if (typeof val === 'string' && val.length > 0) {
      return val
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    }
  }
  return []
}

// ── Airtable types ───────────────────────────────────────────────────────────

interface AirtableRecord {
  id: string
  fields: Record<string, unknown>
}

interface AirtableResponse {
  records: Array<AirtableRecord>
  offset?: string
}

/**
 * Fetch all records from an Airtable table with pagination.
 */
async function fetchAllRecords(
  baseId: string,
  tableIdOrName: string,
  pat: string,
): Promise<Array<AirtableRecord>> {
  const all: Array<AirtableRecord> = []
  let offset: string | undefined

  do {
    const url = new URL(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableIdOrName)}`,
    )
    if (offset) url.searchParams.set('offset', offset)

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${pat}` },
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Airtable API error (${res.status}): ${text}`)
    }

    const data = (await res.json()) as AirtableResponse
    all.push(...data.records)
    offset = data.offset
  } while (offset)

  return all
}

// ── Import action ────────────────────────────────────────────────────────────

/**
 * Import BAISH CRM data from Airtable into the baishImports table.
 * Rerunnable: deletes all existing records and re-inserts.
 *
 * Run via: npx convex run baishImport:importFromAirtable
 */
export const importFromAirtable = internalAction({
  args: {},
  returns: v.object({
    imported: v.number(),
    skippedNoEmail: v.number(),
    formCount: v.number(),
  }),
  handler: async (ctx) => {
    const pat = process.env.AIRTABLE_PAT
    if (!pat) throw new Error('AIRTABLE_PAT env var is not set')

    const baseId = 'app2EMVZr0HLk1gWt'

    // Fetch both tables in parallel
    const [personas, formularios] = await Promise.all([
      fetchAllRecords(baseId, 'Personas', pat),
      fetchAllRecords(baseId, 'Formularios', pat),
    ])

    console.log(
      `Fetched ${personas.length} personas, ${formularios.length} formularios`,
    )

    // Index formularios by record ID for joining
    const formsByPersonId = new Map<string, Array<AirtableRecord>>()
    for (const form of formularios) {
      const linkedPersonas = form.fields['Persona'] as Array<string> | undefined
      if (linkedPersonas) {
        for (const personId of linkedPersonas) {
          const existing = formsByPersonId.get(personId) ?? []
          existing.push(form)
          formsByPersonId.set(personId, existing)
        }
      }
    }

    // Clear existing imports
    await ctx.runMutation(internal.baishImportMutations.clearBaishImports, {})

    let imported = 0
    let skippedNoEmail = 0

    for (const persona of personas) {
      const f = persona.fields

      // Extract email
      const emailRaw = str(f, 'Email', 'email', 'Correo', 'Correo electrónico')
      if (!emailRaw || !emailRaw.includes('@')) {
        skippedNoEmail++
        continue
      }

      const email = emailRaw.trim().toLowerCase()

      // Other emails (some CRMs store multiple)
      const otherEmails: Array<string> = []
      const otherEmailsRaw = f['Otros emails']
      if (Array.isArray(otherEmailsRaw)) {
        for (const e of otherEmailsRaw) {
          if (typeof e === 'string' && e.includes('@')) {
            otherEmails.push(e.trim().toLowerCase())
          }
        }
      } else if (
        typeof otherEmailsRaw === 'string' &&
        otherEmailsRaw.includes('@')
      ) {
        for (const e of otherEmailsRaw.split(',')) {
          const trimmed = e.trim().toLowerCase()
          if (trimmed.includes('@')) otherEmails.push(trimmed)
        }
      }

      const intereses = strArray(f, 'Intereses', 'Áreas de interés')
      const participoEn = strArray(f, 'Participó en', 'Programas')

      // Join form responses
      const personForms = formsByPersonId.get(persona.id) ?? []
      const formResponses = personForms.map((form) => {
        const ff = form.fields
        const known = new Set([
          'Persona',
          'Nombre del formulario',
          'Submitted at',
          'Objetivos profesionales',
          'Career goals',
          'Qué aprendiste',
          'What learned',
          'Próximos pasos',
          'Next steps',
          'Feedback',
          'Comentarios',
        ])

        const otherFields: Record<string, unknown> = {}
        for (const [key, val] of Object.entries(ff)) {
          if (
            !known.has(key) &&
            val !== null &&
            val !== undefined &&
            val !== ''
          ) {
            otherFields[key] = val
          }
        }

        return {
          formName: str(ff, 'Nombre del formulario', 'Form name'),
          submittedAt: str(ff, 'Submitted at', 'Fecha'),
          careerGoals: str(ff, 'Objetivos profesionales', 'Career goals'),
          whatLearned: str(ff, 'Qué aprendiste', 'What learned'),
          nextSteps: str(ff, 'Próximos pasos', 'Next steps'),
          feedback: str(ff, 'Feedback', 'Comentarios'),
          otherResponses:
            Object.keys(otherFields).length > 0
              ? JSON.stringify(otherFields)
              : undefined,
        }
      })

      await ctx.runMutation(internal.baishImportMutations.insertBaishImport, {
        email,
        otherEmails: otherEmails.length > 0 ? otherEmails : undefined,
        nombre: str(f, 'Nombre', 'Name', 'Nombre completo'),
        vinculo: str(f, 'Vínculo', 'Vinculo'),
        rol: str(f, 'Rol', 'Role'),
        etapaProfesional: str(f, 'Etapa profesional', 'Professional stage'),
        experienciaAiSafety: str(
          f,
          'Experiencia AI Safety',
          'AI Safety experience',
        ),
        intereses: intereses.length > 0 ? intereses : undefined,
        participoEn: participoEn.length > 0 ? participoEn : undefined,
        disponibilidad: str(f, 'Disponibilidad', 'Availability'),
        linkedin: str(f, 'LinkedIn', 'LinkedIn URL'),
        formResponses: formResponses.length > 0 ? formResponses : undefined,
      })

      imported++
    }

    console.log(
      `Import complete: ${imported} imported, ${skippedNoEmail} skipped (no email), ${formularios.length} forms processed`,
    )

    return {
      imported,
      skippedNoEmail,
      formCount: formularios.length,
    }
  },
})
