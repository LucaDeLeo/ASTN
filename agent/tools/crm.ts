import { z } from 'zod'
import { tool } from '@anthropic-ai/claude-agent-sdk'
import type { ConvexClient } from 'convex/browser'
import type { Id } from '../../convex/_generated/dataModel'
import { api } from '../../convex/_generated/api'
import type { ConfirmationContext } from './confirmable'
import { confirmAction } from './confirmable'

type CrmCollection =
  | 'personas'
  | 'organizaciones'
  | 'oportunidades'
  | 'formularios'

const collectionSchema = z
  .enum(['personas', 'organizaciones', 'oportunidades', 'formularios'])
  .describe('Which CRM collection to operate on')

function formatRecord(col: CrmCollection, r: any): string {
  const id = r._id
  if (col === 'personas') {
    return `- **${r.nombre ?? 'No name'}** | ${r.email ?? '—'} | ${r.rol ?? '—'} | ID: ${id}`
  }
  if (col === 'organizaciones') {
    return `- **${r.nombre ?? 'No name'}** | ${r.tipo ?? '—'} | ${r.tematicaPrincipal ?? '—'} | ID: ${id}`
  }
  if (col === 'oportunidades') {
    return `- **${r.titulo ?? 'No title'}** | ${r.organizacion ?? '—'} | ${r.estado ?? '—'} | ${r.categoria ?? '—'} | ID: ${id}`
  }
  return `- **${r.participante ?? '(no participant)'}** | ${r.periodo ?? '—'} | ${r.fuente ?? '—'} | ID: ${id}`
}

async function listCollection(
  convex: ConvexClient,
  orgId: Id<'organizations'>,
  collection: CrmCollection,
  searchQuery?: string,
) {
  if (collection === 'personas') {
    return await convex.query(api.crm.listPersonas, { orgId, searchQuery })
  }
  if (collection === 'organizaciones') {
    return await convex.query(api.crm.listOrganizaciones, {
      orgId,
      searchQuery,
    })
  }
  if (collection === 'oportunidades') {
    return await convex.query(api.crm.listOportunidades, {
      orgId,
      searchQuery,
    })
  }
  return await convex.query(api.crm.listFormularios, { orgId })
}

export function createCrmTools(
  convex: ConvexClient,
  orgId: Id<'organizations'>,
  _userId: string,
  confirmCtx: ConfirmationContext,
) {
  return [
    tool(
      'list_crm_records',
      'List records from a CRM collection (personas, organizaciones, oportunidades, formularios). Optionally filter by a text search query (matches on the primary name/title field).',
      {
        collection: collectionSchema,
        searchQuery: z
          .string()
          .optional()
          .describe('Optional text to search in the primary name/title field'),
      },
      async (args) => {
        try {
          const records = await listCollection(
            convex,
            orgId,
            args.collection as CrmCollection,
            args.searchQuery,
          )
          if (!records || records.length === 0) {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: `No records found in ${args.collection}.`,
                },
              ],
            }
          }
          const lines = records.map((r: any) =>
            formatRecord(args.collection as CrmCollection, r),
          )
          return {
            content: [
              {
                type: 'text' as const,
                text: `## ${args.collection} (${records.length})\n\n${lines.join('\n')}`,
              },
            ],
          }
        } catch (e: any) {
          console.error('[tool] list_crm_records ERROR:', e)
          return {
            content: [{ type: 'text' as const, text: `Error: ${e.message}` }],
            isError: true,
          }
        }
      },
    ),

    tool(
      'get_crm_record',
      'Get all fields of a single CRM record. Use the Convex document ID from list_crm_records.',
      {
        collection: collectionSchema,
        id: z.string().describe('Convex document ID (e.g. "k97x2...")'),
      },
      async (args) => {
        try {
          const records = await listCollection(
            convex,
            orgId,
            args.collection as CrmCollection,
          )
          const record = (records as any[]).find((r) => r._id === args.id)
          if (!record) {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: `Record ${args.id} not found in ${args.collection}.`,
                },
              ],
            }
          }
          const lines = Object.entries(record)
            .filter(
              ([k]) =>
                ![
                  '_id',
                  '_creationTime',
                  'orgId',
                  'createdAt',
                  'updatedAt',
                ].includes(k),
            )
            .map(
              ([k, v]) => `- **${k}**: ${v == null ? '—' : JSON.stringify(v)}`,
            )
          return {
            content: [
              {
                type: 'text' as const,
                text: `## ${args.collection} record\n\n${lines.join('\n')}`,
              },
            ],
          }
        } catch (e: any) {
          return {
            content: [{ type: 'text' as const, text: `Error: ${e.message}` }],
            isError: true,
          }
        }
      },
    ),

    tool(
      'get_crm_stats',
      'Get record counts for all 4 CRM collections (personas, organizaciones, oportunidades, formularios).',
      {},
      async () => {
        try {
          const stats = await convex.query(api.crm.getStats, { orgId })
          return {
            content: [
              {
                type: 'text' as const,
                text:
                  `## CRM Stats\n\n` +
                  `- Personas: ${stats.personas}\n` +
                  `- Organizaciones: ${stats.organizaciones}\n` +
                  `- Oportunidades: ${stats.oportunidades}\n` +
                  `- Formularios: ${stats.formularios}`,
              },
            ],
          }
        } catch (e: any) {
          return {
            content: [{ type: 'text' as const, text: `Error: ${e.message}` }],
            isError: true,
          }
        }
      },
    ),

    tool(
      'create_crm_record',
      'Create a new CRM record (personas, organizaciones, oportunidades). Not supported for formularios. Fields is an object with the relevant keys — see schema. Requires user confirmation.',
      {
        collection: z
          .enum(['personas', 'organizaciones', 'oportunidades'])
          .describe('Which CRM collection to create a record in'),
        fields: z
          .record(z.string(), z.any())
          .describe(
            'Object with record fields. For personas use nombre/email/rol/etc. For organizaciones use nombre/descripcion/tipo. For oportunidades use titulo/organizacion/categoria/estado.',
          ),
      },
      async (args) => {
        try {
          const primary =
            args.collection === 'oportunidades'
              ? args.fields.titulo
              : args.fields.nombre
          const approved = await confirmAction(confirmCtx, {
            action: 'Create CRM Record',
            description: `Create new ${args.collection.slice(0, -1)}: "${primary ?? '(no name)'}"`,
            details: {
              collection: args.collection,
              fields: args.fields,
            },
          })
          if (!approved) {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: 'Action rejected by user.',
                },
              ],
            }
          }

          let newId: string
          if (args.collection === 'personas') {
            newId = await convex.mutation(api.crm.createPersonaWithFields, {
              orgId,
              fields: args.fields,
            })
          } else if (args.collection === 'organizaciones') {
            newId = await convex.mutation(
              api.crm.createOrganizacionWithFields,
              { orgId, fields: args.fields },
            )
          } else {
            newId = await convex.mutation(api.crm.createOportunidadWithFields, {
              orgId,
              fields: args.fields,
            })
          }

          return {
            content: [
              {
                type: 'text' as const,
                text: `Created ${args.collection.slice(0, -1)} with ID ${newId}.`,
              },
            ],
          }
        } catch (e: any) {
          return {
            content: [{ type: 'text' as const, text: `Error: ${e.message}` }],
            isError: true,
          }
        }
      },
    ),

    tool(
      'update_crm_record',
      'Update a single field on a CRM record (personas, organizaciones, oportunidades). Requires user confirmation. Use the Convex ID from list_crm_records.',
      {
        collection: z
          .enum(['personas', 'organizaciones', 'oportunidades'])
          .describe('Which collection the record belongs to'),
        id: z.string().describe('Convex document ID'),
        field: z
          .string()
          .describe('Field name (camelCase, e.g. "nombre", "estado")'),
        value: z.any().describe('New value for the field'),
      },
      async (args) => {
        try {
          const approved = await confirmAction(confirmCtx, {
            action: 'Update CRM Record',
            description: `Set ${args.field} on ${args.collection.slice(0, -1)} ${args.id}`,
            details: {
              collection: args.collection,
              id: args.id,
              field: args.field,
              newValue: args.value,
            },
          })
          if (!approved) {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: 'Action rejected by user.',
                },
              ],
            }
          }

          if (args.collection === 'personas') {
            await convex.mutation(api.crm.updatePersona, {
              id: args.id as Id<'crmPersonas'>,
              field: args.field,
              value: args.value,
            })
          } else if (args.collection === 'organizaciones') {
            await convex.mutation(api.crm.updateOrganizacion, {
              id: args.id as Id<'crmOrganizaciones'>,
              field: args.field,
              value: args.value,
            })
          } else {
            await convex.mutation(api.crm.updateOportunidad, {
              id: args.id as Id<'crmOportunidades'>,
              field: args.field,
              value: args.value,
            })
          }

          return {
            content: [
              {
                type: 'text' as const,
                text: `Updated ${args.field} on ${args.id}.`,
              },
            ],
          }
        } catch (e: any) {
          return {
            content: [{ type: 'text' as const, text: `Error: ${e.message}` }],
            isError: true,
          }
        }
      },
    ),
  ]
}
