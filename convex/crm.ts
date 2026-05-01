import { v } from 'convex/values'
import type { Doc, Id } from './_generated/dataModel'
import type { MutationCtx } from './_generated/server'
import { mutation, query } from './_generated/server'
import { requireOrgAdmin } from './lib/auth'

// Editable fields per collection — used to gate inline updates.
// orgId, _id, _creationTime, createdAt, updatedAt are intentionally excluded.
const PERSONA_EDITABLE = new Set([
  'nombre',
  'email',
  'telefono',
  'linkedin',
  'paginaWeb',
  'vinculo',
  'rol',
  'cargo',
  'campoProfesional',
  'etapaProfesional',
  'experienciaAiSafety',
  'habilidades',
  'intereses',
  'disponibilidad',
  'ubicacion',
  'enBuenosAires',
  'fuenteContacto',
  'personaContacto',
  'primerContacto',
  'organizacionesAsociadas',
  'participoEn',
  'notas',
])
const ORGANIZACION_EDITABLE = new Set([
  'nombre',
  'descripcion',
  'personasClave',
  'tipo',
  'posturaIA',
  'tematicaPrincipal',
  'notas',
  'resumenAuto',
])
const OPORTUNIDAD_EDITABLE = new Set([
  'titulo',
  'organizacion',
  'ubicacion',
  'tipo',
  'categoria',
  'fecha',
  'estado',
  'fuente',
])

// Spreadsheets express yes/no in many ways. Coerce to boolean | undefined.
const YES_VALUES = new Set(['si', 'sí', 'yes', 'y', 'true', '1', 'x'])
const NO_VALUES = new Set(['no', 'n', 'false', '0', ''])
function parseYesNo(value: any): boolean | undefined {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') {
    const s = value.trim().toLowerCase()
    if (YES_VALUES.has(s)) return true
    if (NO_VALUES.has(s)) return false
  }
  return undefined
}

// ── Doc validators (used in `returns` for client type inference) ──

const personaDoc = v.object({
  _id: v.id('crmPersonas'),
  _creationTime: v.number(),
  orgId: v.id('organizations'),
  nombre: v.string(),
  email: v.optional(v.string()),
  telefono: v.optional(v.string()),
  linkedin: v.optional(v.string()),
  paginaWeb: v.optional(v.string()),
  vinculo: v.optional(v.string()),
  rol: v.optional(v.string()),
  cargo: v.optional(v.string()),
  campoProfesional: v.optional(v.string()),
  etapaProfesional: v.optional(v.string()),
  experienciaAiSafety: v.optional(v.string()),
  habilidades: v.optional(v.string()),
  intereses: v.optional(v.string()),
  disponibilidad: v.optional(v.string()),
  ubicacion: v.optional(v.string()),
  enBuenosAires: v.optional(v.boolean()),
  fuenteContacto: v.optional(v.string()),
  personaContacto: v.optional(v.string()),
  primerContacto: v.optional(v.string()),
  organizacionesAsociadas: v.optional(v.string()),
  participoEn: v.optional(v.string()),
  notas: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
})

const organizacionDoc = v.object({
  _id: v.id('crmOrganizaciones'),
  _creationTime: v.number(),
  orgId: v.id('organizations'),
  nombre: v.string(),
  descripcion: v.optional(v.string()),
  personasClave: v.optional(v.string()),
  tipo: v.optional(v.string()),
  posturaIA: v.optional(v.string()),
  tematicaPrincipal: v.optional(v.string()),
  notas: v.optional(v.string()),
  resumenAuto: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
})

const oportunidadDoc = v.object({
  _id: v.id('crmOportunidades'),
  _creationTime: v.number(),
  orgId: v.id('organizations'),
  titulo: v.string(),
  organizacion: v.optional(v.string()),
  ubicacion: v.optional(v.string()),
  tipo: v.optional(v.string()),
  categoria: v.optional(v.string()),
  fecha: v.optional(v.string()),
  estado: v.optional(v.string()),
  fuente: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
})

const formularioDoc = v.object({
  _id: v.id('crmFormularios'),
  _creationTime: v.number(),
  orgId: v.id('organizations'),
  participante: v.optional(v.string()),
  periodo: v.optional(v.string()),
  fuente: v.optional(v.string()),
  datos: v.record(v.string(), v.any()),
  createdAt: v.number(),
  updatedAt: v.number(),
})

// ── Input mappers ──
//
// Single source of truth for normalizing record input → DB shape. Used by
// both batch inserts (which see Excel-style Spanish headers) and single
// `*WithFields` paths (which receive camelCase from the agent). The Spanish
// fallbacks are harmless when missing, so a single mapper handles both.

type PersonaInput = Omit<
  Doc<'crmPersonas'>,
  '_id' | '_creationTime' | 'orgId' | 'createdAt' | 'updatedAt'
>

function mapPersona(record: any): PersonaInput {
  return {
    nombre: record.nombre ?? record.Nombre ?? 'No name',
    email: record.email ?? record.Email ?? undefined,
    telefono: record.telefono ?? record['Teléfono'] ?? undefined,
    linkedin: record.linkedin ?? record.LinkedIn ?? undefined,
    paginaWeb: record.paginaWeb ?? record['Página web'] ?? undefined,
    vinculo: record.vinculo ?? record['Vínculo'] ?? undefined,
    rol: record.rol ?? record.Rol ?? undefined,
    cargo: record.cargo ?? record.Cargo ?? undefined,
    campoProfesional:
      record.campoProfesional ?? record['Campo profesional'] ?? undefined,
    etapaProfesional:
      record.etapaProfesional ?? record['Etapa profesional'] ?? undefined,
    experienciaAiSafety:
      record.experienciaAiSafety ??
      record['Experiencia en AI Safety'] ??
      undefined,
    habilidades: record.habilidades ?? record.Habilidades ?? undefined,
    intereses: record.intereses ?? record.Intereses ?? undefined,
    disponibilidad: record.disponibilidad ?? record.Disponibilidad ?? undefined,
    ubicacion: record.ubicacion ?? record['Ubicación'] ?? undefined,
    enBuenosAires: parseYesNo(
      record.enBuenosAires ?? record['En Buenos Aires'],
    ),
    fuenteContacto:
      record.fuenteContacto ?? record['Fuente de contacto'] ?? undefined,
    personaContacto:
      record.personaContacto ?? record['Persona de contacto'] ?? undefined,
    primerContacto:
      record.primerContacto ?? record['Primer contacto'] ?? undefined,
    organizacionesAsociadas:
      record.organizacionesAsociadas ??
      record['Organizaciones asociadas'] ??
      undefined,
    participoEn: record.participoEn ?? record['Participó en'] ?? undefined,
    notas: record.notas ?? record.Notas ?? undefined,
  }
}

type OrganizacionInput = Omit<
  Doc<'crmOrganizaciones'>,
  '_id' | '_creationTime' | 'orgId' | 'createdAt' | 'updatedAt'
>

function mapOrganizacion(record: any): OrganizacionInput {
  return {
    nombre: record.nombre ?? record.Nombre ?? 'No name',
    descripcion: record.descripcion ?? record['Descripción'] ?? undefined,
    personasClave:
      record.personasClave ?? record['Personas clave'] ?? undefined,
    tipo: record.tipo ?? record.Tipo ?? undefined,
    posturaIA: record.posturaIA ?? record['Postura IA/regulación'] ?? undefined,
    tematicaPrincipal:
      record.tematicaPrincipal ?? record['Temática principal'] ?? undefined,
    notas: record.notas ?? record.Notas ?? undefined,
    resumenAuto:
      record.resumenAuto ?? record['Resumen auto-generado'] ?? undefined,
  }
}

type OportunidadInput = Omit<
  Doc<'crmOportunidades'>,
  '_id' | '_creationTime' | 'orgId' | 'createdAt' | 'updatedAt'
>

function mapOportunidad(record: any): OportunidadInput {
  return {
    titulo: record.titulo ?? record['Título'] ?? 'No title',
    organizacion: record.organizacion ?? record['Organización'] ?? undefined,
    ubicacion: record.ubicacion ?? record['Ubicación'] ?? undefined,
    tipo: record.tipo ?? record.Tipo ?? undefined,
    categoria: record.categoria ?? record['Categoría'] ?? undefined,
    fecha: record.fecha ?? record.Fecha ?? undefined,
    estado: record.estado ?? record.Estado ?? undefined,
    fuente: record.fuente ?? record.Fuente ?? undefined,
  }
}

const FORMULARIO_PROMOTED_KEYS = new Set([
  'Participante',
  'Periodo',
  'Fuente',
  'participante',
  'periodo',
  'fuente',
])
const FORMULARIO_SYSTEM_KEYS = new Set([
  '_id',
  '_creationTime',
  'orgId',
  'createdAt',
  'updatedAt',
])

function mapFormulario(record: any) {
  const datos: Record<string, any> = {}
  for (const [k, val] of Object.entries(record)) {
    if (FORMULARIO_PROMOTED_KEYS.has(k) || FORMULARIO_SYSTEM_KEYS.has(k))
      continue
    datos[k] = val
  }
  return {
    participante: record.participante ?? record.Participante ?? undefined,
    periodo: record.periodo ?? record.Periodo ?? undefined,
    fuente: record.fuente ?? record.Fuente ?? undefined,
    datos,
  }
}

// ── Counter helpers (avoids materializing whole collections in getStats) ──

type CountField =
  | 'personas'
  | 'organizaciones'
  | 'oportunidades'
  | 'formularios'

const COLLECTION_TO_COUNT_FIELD: Record<
  'crmPersonas' | 'crmOrganizaciones' | 'crmOportunidades' | 'crmFormularios',
  CountField
> = {
  crmPersonas: 'personas',
  crmOrganizaciones: 'organizaciones',
  crmOportunidades: 'oportunidades',
  crmFormularios: 'formularios',
}

// Convex's OCC normally serializes concurrent first-write inserts so only
// one counter row per org survives. To stay robust even if a duplicate ever
// slips through, this is self-healing: it collects all rows for the org,
// merges their values into the first one, deletes the extras, and then
// applies the delta. Steady-state cost is one indexed lookup.
async function bumpCount(
  ctx: MutationCtx,
  orgId: Id<'organizations'>,
  field: CountField,
  delta: number,
) {
  const rows = await ctx.db
    .query('crmCounts')
    .withIndex('by_orgId', (q) => q.eq('orgId', orgId))
    .collect()

  if (rows.length === 0) {
    await ctx.db.insert('crmCounts', {
      orgId,
      personas: field === 'personas' ? Math.max(0, delta) : 0,
      organizaciones: field === 'organizaciones' ? Math.max(0, delta) : 0,
      oportunidades: field === 'oportunidades' ? Math.max(0, delta) : 0,
      formularios: field === 'formularios' ? Math.max(0, delta) : 0,
    })
    return
  }

  if (rows.length === 1) {
    const r = rows[0]
    await ctx.db.patch(r._id, {
      [field]: Math.max(0, r[field] + delta),
    })
    return
  }

  // Duplicate rows existed — consolidate.
  const [primary, ...extras] = rows
  const merged = {
    personas: rows.reduce((s, r) => s + r.personas, 0),
    organizaciones: rows.reduce((s, r) => s + r.organizaciones, 0),
    oportunidades: rows.reduce((s, r) => s + r.oportunidades, 0),
    formularios: rows.reduce((s, r) => s + r.formularios, 0),
  }
  merged[field] = Math.max(0, merged[field] + delta)
  await ctx.db.patch(primary._id, merged)
  for (const extra of extras) {
    await ctx.db.delete(extra._id)
  }
}

// ── Queries: List ──

export const listPersonas = query({
  args: {
    orgId: v.id('organizations'),
    searchQuery: v.optional(v.string()),
  },
  returns: v.array(personaDoc),
  handler: async (ctx, args) => {
    await requireOrgAdmin(ctx, args.orgId)

    if (args.searchQuery && args.searchQuery.trim().length > 0) {
      return await ctx.db
        .query('crmPersonas')
        .withSearchIndex('search_nombre', (q) =>
          q.search('nombre', args.searchQuery!).eq('orgId', args.orgId),
        )
        .collect()
    }

    return await ctx.db
      .query('crmPersonas')
      .withIndex('by_orgId', (q) => q.eq('orgId', args.orgId))
      .collect()
  },
})

export const listOrganizaciones = query({
  args: {
    orgId: v.id('organizations'),
    searchQuery: v.optional(v.string()),
  },
  returns: v.array(organizacionDoc),
  handler: async (ctx, args) => {
    await requireOrgAdmin(ctx, args.orgId)

    if (args.searchQuery && args.searchQuery.trim().length > 0) {
      return await ctx.db
        .query('crmOrganizaciones')
        .withSearchIndex('search_nombre', (q) =>
          q.search('nombre', args.searchQuery!).eq('orgId', args.orgId),
        )
        .collect()
    }

    return await ctx.db
      .query('crmOrganizaciones')
      .withIndex('by_orgId', (q) => q.eq('orgId', args.orgId))
      .collect()
  },
})

export const listOportunidades = query({
  args: {
    orgId: v.id('organizations'),
    searchQuery: v.optional(v.string()),
  },
  returns: v.array(oportunidadDoc),
  handler: async (ctx, args) => {
    await requireOrgAdmin(ctx, args.orgId)

    if (args.searchQuery && args.searchQuery.trim().length > 0) {
      return await ctx.db
        .query('crmOportunidades')
        .withSearchIndex('search_titulo', (q) =>
          q.search('titulo', args.searchQuery!).eq('orgId', args.orgId),
        )
        .collect()
    }

    return await ctx.db
      .query('crmOportunidades')
      .withIndex('by_orgId', (q) => q.eq('orgId', args.orgId))
      .collect()
  },
})

export const listFormularios = query({
  args: {
    orgId: v.id('organizations'),
  },
  returns: v.array(formularioDoc),
  handler: async (ctx, args) => {
    await requireOrgAdmin(ctx, args.orgId)

    return await ctx.db
      .query('crmFormularios')
      .withIndex('by_orgId', (q) => q.eq('orgId', args.orgId))
      .collect()
  },
})

// ── Queries: Single record ──

export const getPersona = query({
  args: { id: v.id('crmPersonas') },
  returns: v.union(personaDoc, v.null()),
  handler: async (ctx, args) => {
    const record = await ctx.db.get(args.id)
    if (!record) return null
    await requireOrgAdmin(ctx, record.orgId)
    return record
  },
})

export const getOrganizacion = query({
  args: { id: v.id('crmOrganizaciones') },
  returns: v.union(organizacionDoc, v.null()),
  handler: async (ctx, args) => {
    const record = await ctx.db.get(args.id)
    if (!record) return null
    await requireOrgAdmin(ctx, record.orgId)
    return record
  },
})

export const getOportunidad = query({
  args: { id: v.id('crmOportunidades') },
  returns: v.union(oportunidadDoc, v.null()),
  handler: async (ctx, args) => {
    const record = await ctx.db.get(args.id)
    if (!record) return null
    await requireOrgAdmin(ctx, record.orgId)
    return record
  },
})

export const getFormulario = query({
  args: { id: v.id('crmFormularios') },
  returns: v.union(formularioDoc, v.null()),
  handler: async (ctx, args) => {
    const record = await ctx.db.get(args.id)
    if (!record) return null
    await requireOrgAdmin(ctx, record.orgId)
    return record
  },
})

// ── Mutations: Insert (batch import) ──

export const insertPersonas = mutation({
  args: {
    orgId: v.id('organizations'),
    records: v.array(v.any()),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    await requireOrgAdmin(ctx, args.orgId)
    const now = Date.now()
    for (const record of args.records) {
      await ctx.db.insert('crmPersonas', {
        orgId: args.orgId,
        ...mapPersona(record),
        createdAt: now,
        updatedAt: now,
      })
    }
    if (args.records.length > 0) {
      await bumpCount(ctx, args.orgId, 'personas', args.records.length)
    }
    return args.records.length
  },
})

export const insertOrganizaciones = mutation({
  args: {
    orgId: v.id('organizations'),
    records: v.array(v.any()),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    await requireOrgAdmin(ctx, args.orgId)
    const now = Date.now()
    for (const record of args.records) {
      await ctx.db.insert('crmOrganizaciones', {
        orgId: args.orgId,
        ...mapOrganizacion(record),
        createdAt: now,
        updatedAt: now,
      })
    }
    if (args.records.length > 0) {
      await bumpCount(ctx, args.orgId, 'organizaciones', args.records.length)
    }
    return args.records.length
  },
})

export const insertOportunidades = mutation({
  args: {
    orgId: v.id('organizations'),
    records: v.array(v.any()),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    await requireOrgAdmin(ctx, args.orgId)
    const now = Date.now()
    for (const record of args.records) {
      await ctx.db.insert('crmOportunidades', {
        orgId: args.orgId,
        ...mapOportunidad(record),
        createdAt: now,
        updatedAt: now,
      })
    }
    if (args.records.length > 0) {
      await bumpCount(ctx, args.orgId, 'oportunidades', args.records.length)
    }
    return args.records.length
  },
})

export const insertFormularios = mutation({
  args: {
    orgId: v.id('organizations'),
    records: v.array(v.any()),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    await requireOrgAdmin(ctx, args.orgId)
    const now = Date.now()
    for (const record of args.records) {
      await ctx.db.insert('crmFormularios', {
        orgId: args.orgId,
        ...mapFormulario(record),
        createdAt: now,
        updatedAt: now,
      })
    }
    if (args.records.length > 0) {
      await bumpCount(ctx, args.orgId, 'formularios', args.records.length)
    }
    return args.records.length
  },
})

// ── Mutations: Create single (manual row) ──

export const createEmptyPersona = mutation({
  args: { orgId: v.id('organizations') },
  returns: v.id('crmPersonas'),
  handler: async (ctx, args) => {
    await requireOrgAdmin(ctx, args.orgId)
    const now = Date.now()
    const id = await ctx.db.insert('crmPersonas', {
      orgId: args.orgId,
      nombre: 'New person',
      createdAt: now,
      updatedAt: now,
    })
    await bumpCount(ctx, args.orgId, 'personas', 1)
    return id
  },
})

export const createEmptyOrganizacion = mutation({
  args: { orgId: v.id('organizations') },
  returns: v.id('crmOrganizaciones'),
  handler: async (ctx, args) => {
    await requireOrgAdmin(ctx, args.orgId)
    const now = Date.now()
    const id = await ctx.db.insert('crmOrganizaciones', {
      orgId: args.orgId,
      nombre: 'New organization',
      createdAt: now,
      updatedAt: now,
    })
    await bumpCount(ctx, args.orgId, 'organizaciones', 1)
    return id
  },
})

export const createEmptyOportunidad = mutation({
  args: { orgId: v.id('organizations') },
  returns: v.id('crmOportunidades'),
  handler: async (ctx, args) => {
    await requireOrgAdmin(ctx, args.orgId)
    const now = Date.now()
    const id = await ctx.db.insert('crmOportunidades', {
      orgId: args.orgId,
      titulo: 'New opportunity',
      createdAt: now,
      updatedAt: now,
    })
    await bumpCount(ctx, args.orgId, 'oportunidades', 1)
    return id
  },
})

export const createEmptyFormulario = mutation({
  args: { orgId: v.id('organizations') },
  returns: v.id('crmFormularios'),
  handler: async (ctx, args) => {
    await requireOrgAdmin(ctx, args.orgId)
    const now = Date.now()
    const id = await ctx.db.insert('crmFormularios', {
      orgId: args.orgId,
      datos: {},
      createdAt: now,
      updatedAt: now,
    })
    await bumpCount(ctx, args.orgId, 'formularios', 1)
    return id
  },
})

// Create with fields — used by the admin agent
export const createPersonaWithFields = mutation({
  args: {
    orgId: v.id('organizations'),
    fields: v.any(),
  },
  returns: v.id('crmPersonas'),
  handler: async (ctx, args) => {
    await requireOrgAdmin(ctx, args.orgId)
    const now = Date.now()
    const id = await ctx.db.insert('crmPersonas', {
      orgId: args.orgId,
      ...mapPersona(args.fields ?? {}),
      createdAt: now,
      updatedAt: now,
    })
    await bumpCount(ctx, args.orgId, 'personas', 1)
    return id
  },
})

export const createOrganizacionWithFields = mutation({
  args: {
    orgId: v.id('organizations'),
    fields: v.any(),
  },
  returns: v.id('crmOrganizaciones'),
  handler: async (ctx, args) => {
    await requireOrgAdmin(ctx, args.orgId)
    const now = Date.now()
    const id = await ctx.db.insert('crmOrganizaciones', {
      orgId: args.orgId,
      ...mapOrganizacion(args.fields ?? {}),
      createdAt: now,
      updatedAt: now,
    })
    await bumpCount(ctx, args.orgId, 'organizaciones', 1)
    return id
  },
})

export const createOportunidadWithFields = mutation({
  args: {
    orgId: v.id('organizations'),
    fields: v.any(),
  },
  returns: v.id('crmOportunidades'),
  handler: async (ctx, args) => {
    await requireOrgAdmin(ctx, args.orgId)
    const now = Date.now()
    const id = await ctx.db.insert('crmOportunidades', {
      orgId: args.orgId,
      ...mapOportunidad(args.fields ?? {}),
      createdAt: now,
      updatedAt: now,
    })
    await bumpCount(ctx, args.orgId, 'oportunidades', 1)
    return id
  },
})

// ── Mutations: Update (inline edit) ──

export const updatePersona = mutation({
  args: {
    id: v.id('crmPersonas'),
    field: v.string(),
    value: v.any(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!PERSONA_EDITABLE.has(args.field)) {
      throw new Error(`Field "${args.field}" is not editable on personas`)
    }
    const record = await ctx.db.get(args.id)
    if (!record) throw new Error('Persona not found')
    await requireOrgAdmin(ctx, record.orgId)

    await ctx.db.patch(args.id, {
      [args.field]: args.value,
      updatedAt: Date.now(),
    })
    return null
  },
})

export const updateOrganizacion = mutation({
  args: {
    id: v.id('crmOrganizaciones'),
    field: v.string(),
    value: v.any(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!ORGANIZACION_EDITABLE.has(args.field)) {
      throw new Error(`Field "${args.field}" is not editable on organizaciones`)
    }
    const record = await ctx.db.get(args.id)
    if (!record) throw new Error('Organización not found')
    await requireOrgAdmin(ctx, record.orgId)

    await ctx.db.patch(args.id, {
      [args.field]: args.value,
      updatedAt: Date.now(),
    })
    return null
  },
})

export const updateOportunidad = mutation({
  args: {
    id: v.id('crmOportunidades'),
    field: v.string(),
    value: v.any(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!OPORTUNIDAD_EDITABLE.has(args.field)) {
      throw new Error(`Field "${args.field}" is not editable on oportunidades`)
    }
    const record = await ctx.db.get(args.id)
    if (!record) throw new Error('Oportunidad not found')
    await requireOrgAdmin(ctx, record.orgId)

    await ctx.db.patch(args.id, {
      [args.field]: args.value,
      updatedAt: Date.now(),
    })
    return null
  },
})

// ── Mutations: Delete single ──

export const deletePersona = mutation({
  args: { id: v.id('crmPersonas') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const record = await ctx.db.get(args.id)
    if (!record) throw new Error('Persona not found')
    await requireOrgAdmin(ctx, record.orgId)
    await ctx.db.delete(args.id)
    await bumpCount(ctx, record.orgId, 'personas', -1)
    return null
  },
})

export const deleteOrganizacion = mutation({
  args: { id: v.id('crmOrganizaciones') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const record = await ctx.db.get(args.id)
    if (!record) throw new Error('Organización not found')
    await requireOrgAdmin(ctx, record.orgId)
    await ctx.db.delete(args.id)
    await bumpCount(ctx, record.orgId, 'organizaciones', -1)
    return null
  },
})

export const deleteOportunidad = mutation({
  args: { id: v.id('crmOportunidades') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const record = await ctx.db.get(args.id)
    if (!record) throw new Error('Oportunidad not found')
    await requireOrgAdmin(ctx, record.orgId)
    await ctx.db.delete(args.id)
    await bumpCount(ctx, record.orgId, 'oportunidades', -1)
    return null
  },
})

export const deleteFormulario = mutation({
  args: { id: v.id('crmFormularios') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const record = await ctx.db.get(args.id)
    if (!record) throw new Error('Formulario not found')
    await requireOrgAdmin(ctx, record.orgId)
    await ctx.db.delete(args.id)
    await bumpCount(ctx, record.orgId, 'formularios', -1)
    return null
  },
})

// ── Mutations: Clear collection (paginated) ──
//
// Convex caps reads/writes per mutation transaction (~8MB / a few thousand
// docs). For colecciones grandes, the client should call this repeatedly
// until `more === false`.

const CLEAR_BATCH_SIZE = 200

export const clearCollection = mutation({
  args: {
    orgId: v.id('organizations'),
    collection: v.union(
      v.literal('crmPersonas'),
      v.literal('crmOrganizaciones'),
      v.literal('crmOportunidades'),
      v.literal('crmFormularios'),
    ),
  },
  returns: v.object({
    deleted: v.number(),
    more: v.boolean(),
  }),
  handler: async (ctx, args) => {
    await requireOrgAdmin(ctx, args.orgId)

    // Take BATCH+1 to peek whether more remain after this run.
    const records = await ctx.db
      .query(args.collection)
      .withIndex('by_orgId', (q) => q.eq('orgId', args.orgId))
      .take(CLEAR_BATCH_SIZE + 1)

    const more = records.length > CLEAR_BATCH_SIZE
    const toDelete = records.slice(0, CLEAR_BATCH_SIZE)

    for (const record of toDelete) {
      await ctx.db.delete(record._id)
    }
    if (toDelete.length > 0) {
      await bumpCount(
        ctx,
        args.orgId,
        COLLECTION_TO_COUNT_FIELD[args.collection],
        -toDelete.length,
      )
    }
    return { deleted: toDelete.length, more }
  },
})

// ── Queries: Stats ──
//
// Reads a single counter doc (O(1)) instead of materializing each table.

export const getStats = query({
  args: {
    orgId: v.id('organizations'),
  },
  returns: v.object({
    personas: v.number(),
    organizaciones: v.number(),
    oportunidades: v.number(),
    formularios: v.number(),
  }),
  handler: async (ctx, args) => {
    await requireOrgAdmin(ctx, args.orgId)
    // `.collect()` instead of `.unique()` — see bumpCount: tolerate the
    // (theoretical) case of multiple counter rows from a concurrent first
    // write by summing them. The next bumpCount will consolidate.
    const rows = await ctx.db
      .query('crmCounts')
      .withIndex('by_orgId', (q) => q.eq('orgId', args.orgId))
      .collect()
    return {
      personas: rows.reduce((s, r) => s + r.personas, 0),
      organizaciones: rows.reduce((s, r) => s + r.organizaciones, 0),
      oportunidades: rows.reduce((s, r) => s + r.oportunidades, 0),
      formularios: rows.reduce((s, r) => s + r.formularios, 0),
    }
  },
})
