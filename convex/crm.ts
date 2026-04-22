import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireOrgAdmin } from './lib/auth'

// ── Queries ──

export const listPersonas = query({
  args: {
    orgId: v.id('organizations'),
    searchQuery: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await requireOrgAdmin(ctx, args.orgId)

    if (args.searchQuery && args.searchQuery.trim().length > 0) {
      return await ctx.db
        .query('crmPersonas')
        .withSearchIndex('search_nombre', (q: any) =>
          q.search('nombre', args.searchQuery!).eq('orgId', args.orgId),
        )
        .collect()
    }

    return await ctx.db
      .query('crmPersonas')
      .withIndex('by_org', (q: any) => q.eq('orgId', args.orgId))
      .collect()
  },
})

export const listOrganizaciones = query({
  args: {
    orgId: v.id('organizations'),
    searchQuery: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await requireOrgAdmin(ctx, args.orgId)

    if (args.searchQuery && args.searchQuery.trim().length > 0) {
      return await ctx.db
        .query('crmOrganizaciones')
        .withSearchIndex('search_nombre', (q: any) =>
          q.search('nombre', args.searchQuery!).eq('orgId', args.orgId),
        )
        .collect()
    }

    return await ctx.db
      .query('crmOrganizaciones')
      .withIndex('by_org', (q: any) => q.eq('orgId', args.orgId))
      .collect()
  },
})

export const listOportunidades = query({
  args: {
    orgId: v.id('organizations'),
    searchQuery: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await requireOrgAdmin(ctx, args.orgId)

    if (args.searchQuery && args.searchQuery.trim().length > 0) {
      return await ctx.db
        .query('crmOportunidades')
        .withSearchIndex('search_titulo', (q: any) =>
          q.search('titulo', args.searchQuery!).eq('orgId', args.orgId),
        )
        .collect()
    }

    return await ctx.db
      .query('crmOportunidades')
      .withIndex('by_org', (q: any) => q.eq('orgId', args.orgId))
      .collect()
  },
})

export const listFormularios = query({
  args: {
    orgId: v.id('organizations'),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await requireOrgAdmin(ctx, args.orgId)

    return await ctx.db
      .query('crmFormularios')
      .withIndex('by_org', (q: any) => q.eq('orgId', args.orgId))
      .collect()
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
    let count = 0
    for (const record of args.records) {
      await ctx.db.insert('crmPersonas', {
        orgId: args.orgId,
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
        disponibilidad:
          record.disponibilidad ?? record.Disponibilidad ?? undefined,
        ubicacion: record.ubicacion ?? record['Ubicación'] ?? undefined,
        enBuenosAires:
          typeof record.enBuenosAires === 'boolean'
            ? record.enBuenosAires
            : record.enBuenosAires === 'Sí' || record.enBuenosAires === 'sí'
              ? true
              : record.enBuenosAires === 'No' || record.enBuenosAires === 'no'
                ? false
                : undefined,
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
        createdAt: now,
        updatedAt: now,
      })
      count++
    }
    return count
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
    let count = 0
    for (const record of args.records) {
      await ctx.db.insert('crmOrganizaciones', {
        orgId: args.orgId,
        nombre: record.nombre ?? record.Nombre ?? 'No name',
        descripcion: record.descripcion ?? record['Descripción'] ?? undefined,
        personasClave:
          record.personasClave ?? record['Personas clave'] ?? undefined,
        tipo: record.tipo ?? record.Tipo ?? undefined,
        posturaIA:
          record.posturaIA ?? record['Postura IA/regulación'] ?? undefined,
        tematicaPrincipal:
          record.tematicaPrincipal ?? record['Temática principal'] ?? undefined,
        notas: record.notas ?? record.Notas ?? undefined,
        resumenAuto:
          record.resumenAuto ?? record['Resumen auto-generado'] ?? undefined,
        createdAt: now,
        updatedAt: now,
      })
      count++
    }
    return count
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
    let count = 0
    for (const record of args.records) {
      await ctx.db.insert('crmOportunidades', {
        orgId: args.orgId,
        titulo: record.titulo ?? record['Título'] ?? 'No title',
        organizacion:
          record.organizacion ?? record['Organización'] ?? undefined,
        ubicacion: record.ubicacion ?? record['Ubicación'] ?? undefined,
        tipo: record.tipo ?? record.Tipo ?? undefined,
        categoria: record.categoria ?? record['Categoría'] ?? undefined,
        fecha: record.fecha ?? record.Fecha ?? undefined,
        estado: record.estado ?? record.Estado ?? undefined,
        fuente: record.fuente ?? record.Fuente ?? undefined,
        createdAt: now,
        updatedAt: now,
      })
      count++
    }
    return count
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
    let count = 0
    for (const record of args.records) {
      const {
        Participante,
        Periodo,
        Fuente,
        participante,
        periodo,
        fuente,
        ...rest
      } = record
      await ctx.db.insert('crmFormularios', {
        orgId: args.orgId,
        participante: participante ?? Participante ?? undefined,
        periodo: periodo ?? Periodo ?? undefined,
        fuente: fuente ?? Fuente ?? undefined,
        datos: rest,
        createdAt: now,
        updatedAt: now,
      })
      count++
    }
    return count
  },
})

// ── Mutations: Create single (manual row) ──

export const createEmptyPersona = mutation({
  args: { orgId: v.id('organizations') },
  returns: v.id('crmPersonas'),
  handler: async (ctx, args) => {
    await requireOrgAdmin(ctx, args.orgId)
    const now = Date.now()
    return await ctx.db.insert('crmPersonas', {
      orgId: args.orgId,
      nombre: 'New person',
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const createEmptyOrganizacion = mutation({
  args: { orgId: v.id('organizations') },
  returns: v.id('crmOrganizaciones'),
  handler: async (ctx, args) => {
    await requireOrgAdmin(ctx, args.orgId)
    const now = Date.now()
    return await ctx.db.insert('crmOrganizaciones', {
      orgId: args.orgId,
      nombre: 'New organization',
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const createEmptyOportunidad = mutation({
  args: { orgId: v.id('organizations') },
  returns: v.id('crmOportunidades'),
  handler: async (ctx, args) => {
    await requireOrgAdmin(ctx, args.orgId)
    const now = Date.now()
    return await ctx.db.insert('crmOportunidades', {
      orgId: args.orgId,
      titulo: 'New opportunity',
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const createEmptyFormulario = mutation({
  args: { orgId: v.id('organizations') },
  returns: v.id('crmFormularios'),
  handler: async (ctx, args) => {
    await requireOrgAdmin(ctx, args.orgId)
    const now = Date.now()
    return await ctx.db.insert('crmFormularios', {
      orgId: args.orgId,
      datos: {},
      createdAt: now,
      updatedAt: now,
    })
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
    const f = args.fields || {}
    return await ctx.db.insert('crmPersonas', {
      orgId: args.orgId,
      nombre: f.nombre ?? 'No name',
      email: f.email,
      telefono: f.telefono,
      linkedin: f.linkedin,
      paginaWeb: f.paginaWeb,
      vinculo: f.vinculo,
      rol: f.rol,
      cargo: f.cargo,
      campoProfesional: f.campoProfesional,
      etapaProfesional: f.etapaProfesional,
      experienciaAiSafety: f.experienciaAiSafety,
      habilidades: f.habilidades,
      intereses: f.intereses,
      disponibilidad: f.disponibilidad,
      ubicacion: f.ubicacion,
      enBuenosAires:
        typeof f.enBuenosAires === 'boolean' ? f.enBuenosAires : undefined,
      fuenteContacto: f.fuenteContacto,
      personaContacto: f.personaContacto,
      primerContacto: f.primerContacto,
      organizacionesAsociadas: f.organizacionesAsociadas,
      participoEn: f.participoEn,
      notas: f.notas,
      createdAt: now,
      updatedAt: now,
    })
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
    const f = args.fields || {}
    return await ctx.db.insert('crmOrganizaciones', {
      orgId: args.orgId,
      nombre: f.nombre ?? 'No name',
      descripcion: f.descripcion,
      personasClave: f.personasClave,
      tipo: f.tipo,
      posturaIA: f.posturaIA,
      tematicaPrincipal: f.tematicaPrincipal,
      notas: f.notas,
      resumenAuto: f.resumenAuto,
      createdAt: now,
      updatedAt: now,
    })
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
    const f = args.fields || {}
    return await ctx.db.insert('crmOportunidades', {
      orgId: args.orgId,
      titulo: f.titulo ?? 'No title',
      organizacion: f.organizacion,
      ubicacion: f.ubicacion,
      tipo: f.tipo,
      categoria: f.categoria,
      fecha: f.fecha,
      estado: f.estado,
      fuente: f.fuente,
      createdAt: now,
      updatedAt: now,
    })
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
    return null
  },
})

// ── Mutations: Delete (clear collection for re-import) ──

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
  returns: v.number(),
  handler: async (ctx, args) => {
    await requireOrgAdmin(ctx, args.orgId)

    const records = await ctx.db
      .query(args.collection)
      .withIndex('by_org', (q: any) => q.eq('orgId', args.orgId))
      .collect()

    for (const record of records) {
      await ctx.db.delete(record._id)
    }
    return records.length
  },
})

// ── Queries: Stats ──

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

    const [personas, organizaciones, oportunidades, formularios] =
      await Promise.all([
        ctx.db
          .query('crmPersonas')
          .withIndex('by_org', (q: any) => q.eq('orgId', args.orgId))
          .collect(),
        ctx.db
          .query('crmOrganizaciones')
          .withIndex('by_org', (q: any) => q.eq('orgId', args.orgId))
          .collect(),
        ctx.db
          .query('crmOportunidades')
          .withIndex('by_org', (q: any) => q.eq('orgId', args.orgId))
          .collect(),
        ctx.db
          .query('crmFormularios')
          .withIndex('by_org', (q: any) => q.eq('orgId', args.orgId))
          .collect(),
      ])

    return {
      personas: personas.length,
      organizaciones: organizaciones.length,
      oportunidades: oportunidades.length,
      formularios: formularios.length,
    }
  },
})
