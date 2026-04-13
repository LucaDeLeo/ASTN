import { v } from 'convex/values'
import { internalMutation } from './_generated/server'

/**
 * Seed an org + admin membership + sample CRM data for testing.
 * Run with: npx convex run crmSeed:seed
 */
export const seed = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // 1. Create org
    const orgId = await ctx.db.insert('organizations', {
      name: 'BAISH Demo',
      slug: 'baish-demo',
      description: 'Buenos Aires AI Safety Hub — Demo CRM',
      city: 'Buenos Aires',
      country: 'Argentina',
    })

    // 2. Create sample CRM Personas
    const personas = [
      {
        nombre: 'María García',
        email: 'maria@example.com',
        vinculo: 'Miembro activo',
        rol: 'Investigadora',
        cargo: 'Research Fellow',
        campoProfesional: 'AI Safety',
        etapaProfesional: 'Mid-career',
        experienciaAiSafety: 'Intermedio',
        ubicacion: 'Buenos Aires',
        habilidades: 'ML, NLP, Alignment',
      },
      {
        nombre: 'Juan Pérez',
        email: 'juan@example.com',
        vinculo: 'Colaborador',
        rol: 'Estudiante',
        cargo: 'PhD Student',
        campoProfesional: 'Computer Science',
        etapaProfesional: 'Early career',
        experienciaAiSafety: 'Principiante',
        ubicacion: 'Córdoba',
        habilidades: 'Python, Pytorch',
      },
      {
        nombre: 'Ana López',
        email: 'ana@example.com',
        vinculo: 'Voluntaria',
        rol: 'Policy Analyst',
        cargo: 'Analista',
        campoProfesional: 'Public Policy',
        etapaProfesional: 'Senior',
        experienciaAiSafety: 'Avanzado',
        ubicacion: 'Buenos Aires',
        habilidades: 'Governance, Regulation',
      },
      {
        nombre: 'Carlos Ruiz',
        email: 'carlos@example.com',
        vinculo: 'Mentor',
        rol: 'Engineer',
        cargo: 'Senior ML Engineer',
        campoProfesional: 'Machine Learning',
        etapaProfesional: 'Senior',
        experienciaAiSafety: 'Intermedio',
        ubicacion: 'Rosario',
        habilidades: 'Transformers, RLHF, Safety eval',
      },
      {
        nombre: 'Lucía Fernández',
        email: 'lucia@example.com',
        vinculo: 'Participante',
        rol: 'Estudiante',
        cargo: 'Undergrad',
        campoProfesional: 'Philosophy',
        etapaProfesional: 'Early career',
        experienciaAiSafety: 'Principiante',
        ubicacion: 'Buenos Aires',
        habilidades: 'Ethics, Critical thinking',
      },
    ]
    const now = Date.now()
    for (const p of personas) {
      await ctx.db.insert('crmPersonas', {
        orgId,
        ...p,
        createdAt: now,
        updatedAt: now,
      })
    }

    // 3. Create sample CRM Organizaciones
    const orgs = [
      {
        nombre: 'MIRI',
        descripcion: 'Machine Intelligence Research Institute',
        tipo: 'Research',
        posturaIA: 'Pro-safety',
        tematicaPrincipal: 'Alignment research',
      },
      {
        nombre: 'CAIS',
        descripcion: 'Center for AI Safety',
        tipo: 'Research',
        posturaIA: 'Pro-safety',
        tematicaPrincipal: 'Existential risk',
      },
      {
        nombre: 'Anthropic',
        descripcion: 'AI safety company',
        tipo: 'Industry',
        posturaIA: 'Pro-safety',
        tematicaPrincipal: 'Constitutional AI',
      },
    ]
    for (const o of orgs) {
      await ctx.db.insert('crmOrganizaciones', {
        orgId,
        ...o,
        createdAt: now,
        updatedAt: now,
      })
    }

    // 4. Create sample CRM Oportunidades
    const opps = [
      {
        titulo: 'Research Fellow - AI Alignment',
        organizacion: 'MIRI',
        ubicacion: 'Remote',
        tipo: 'Full-time',
        categoria: 'Research',
        estado: 'Activa',
      },
      {
        titulo: 'Policy Analyst - AI Governance',
        organizacion: 'CAIS',
        ubicacion: 'San Francisco',
        tipo: 'Full-time',
        categoria: 'Policy',
        estado: 'Activa',
      },
      {
        titulo: 'ML Engineer - Safety Team',
        organizacion: 'Anthropic',
        ubicacion: 'San Francisco / Remote',
        tipo: 'Full-time',
        categoria: 'Research',
        estado: 'Activa',
      },
      {
        titulo: 'Summer Fellowship 2026',
        organizacion: 'BAISH',
        ubicacion: 'Buenos Aires',
        tipo: 'Fellowship',
        categoria: 'Research',
        estado: 'Abierta',
      },
    ]
    for (const o of opps) {
      await ctx.db.insert('crmOportunidades', {
        orgId,
        ...o,
        createdAt: now,
        updatedAt: now,
      })
    }

    // 5. Create sample CRM Formularios
    const forms = [
      {
        participante: 'María García',
        periodo: '2026-Q1',
        fuente: 'Reading Group',
        datos: {
          motivacion: 'Quiero contribuir a la seguridad de la IA',
          nps: 9,
          horasDedicadas: 10,
        },
      },
      {
        participante: 'Juan Pérez',
        periodo: '2026-Q1',
        fuente: 'Fellowship',
        datos: {
          motivacion: 'Aprender sobre alignment',
          nps: 8,
          horasDedicadas: 15,
        },
      },
    ]
    for (const f of forms) {
      await ctx.db.insert('crmFormularios', {
        orgId,
        ...f,
        createdAt: now,
        updatedAt: now,
      })
    }

    return null
  },
})
