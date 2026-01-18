/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as aggregation_aisafety from "../aggregation/aisafety.js";
import type * as aggregation_dedup from "../aggregation/dedup.js";
import type * as aggregation_eightyK from "../aggregation/eightyK.js";
import type * as aggregation_sync from "../aggregation/sync.js";
import type * as aggregation_syncMutations from "../aggregation/syncMutations.js";
import type * as auth from "../auth.js";
import type * as crons from "../crons.js";
import type * as emails_batchActions from "../emails/batchActions.js";
import type * as emails_send from "../emails/send.js";
import type * as emails_templates from "../emails/templates.js";
import type * as enrichment_conversation from "../enrichment/conversation.js";
import type * as enrichment_extraction from "../enrichment/extraction.js";
import type * as enrichment_queries from "../enrichment/queries.js";
import type * as http from "../http.js";
import type * as matches from "../matches.js";
import type * as matching_compute from "../matching/compute.js";
import type * as matching_mutations from "../matching/mutations.js";
import type * as matching_prompts from "../matching/prompts.js";
import type * as matching_queries from "../matching/queries.js";
import type * as opportunities from "../opportunities.js";
import type * as organizations from "../organizations.js";
import type * as orgs_admin from "../orgs/admin.js";
import type * as orgs_directory from "../orgs/directory.js";
import type * as orgs_membership from "../orgs/membership.js";
import type * as orgs_stats from "../orgs/stats.js";
import type * as profiles from "../profiles.js";
import type * as skills from "../skills.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  "aggregation/aisafety": typeof aggregation_aisafety;
  "aggregation/dedup": typeof aggregation_dedup;
  "aggregation/eightyK": typeof aggregation_eightyK;
  "aggregation/sync": typeof aggregation_sync;
  "aggregation/syncMutations": typeof aggregation_syncMutations;
  auth: typeof auth;
  crons: typeof crons;
  "emails/batchActions": typeof emails_batchActions;
  "emails/send": typeof emails_send;
  "emails/templates": typeof emails_templates;
  "enrichment/conversation": typeof enrichment_conversation;
  "enrichment/extraction": typeof enrichment_extraction;
  "enrichment/queries": typeof enrichment_queries;
  http: typeof http;
  matches: typeof matches;
  "matching/compute": typeof matching_compute;
  "matching/mutations": typeof matching_mutations;
  "matching/prompts": typeof matching_prompts;
  "matching/queries": typeof matching_queries;
  opportunities: typeof opportunities;
  organizations: typeof organizations;
  "orgs/admin": typeof orgs_admin;
  "orgs/directory": typeof orgs_directory;
  "orgs/membership": typeof orgs_membership;
  "orgs/stats": typeof orgs_stats;
  profiles: typeof profiles;
  skills: typeof skills;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  resend: {
    lib: {
      cancelEmail: FunctionReference<
        "mutation",
        "internal",
        { emailId: string },
        null
      >;
      cleanupAbandonedEmails: FunctionReference<
        "mutation",
        "internal",
        { olderThan?: number },
        null
      >;
      cleanupOldEmails: FunctionReference<
        "mutation",
        "internal",
        { olderThan?: number },
        null
      >;
      createManualEmail: FunctionReference<
        "mutation",
        "internal",
        {
          from: string;
          headers?: Array<{ name: string; value: string }>;
          replyTo?: Array<string>;
          subject: string;
          to: Array<string> | string;
        },
        string
      >;
      get: FunctionReference<
        "query",
        "internal",
        { emailId: string },
        {
          bcc?: Array<string>;
          bounced?: boolean;
          cc?: Array<string>;
          clicked?: boolean;
          complained: boolean;
          createdAt: number;
          deliveryDelayed?: boolean;
          errorMessage?: string;
          failed?: boolean;
          finalizedAt: number;
          from: string;
          headers?: Array<{ name: string; value: string }>;
          html?: string;
          opened: boolean;
          replyTo: Array<string>;
          resendId?: string;
          segment: number;
          status:
            | "waiting"
            | "queued"
            | "cancelled"
            | "sent"
            | "delivered"
            | "delivery_delayed"
            | "bounced"
            | "failed";
          subject?: string;
          template?: {
            id: string;
            variables?: Record<string, string | number>;
          };
          text?: string;
          to: Array<string>;
        } | null
      >;
      getStatus: FunctionReference<
        "query",
        "internal",
        { emailId: string },
        {
          bounced: boolean;
          clicked: boolean;
          complained: boolean;
          deliveryDelayed: boolean;
          errorMessage: string | null;
          failed: boolean;
          opened: boolean;
          status:
            | "waiting"
            | "queued"
            | "cancelled"
            | "sent"
            | "delivered"
            | "delivery_delayed"
            | "bounced"
            | "failed";
        } | null
      >;
      handleEmailEvent: FunctionReference<
        "mutation",
        "internal",
        { event: any },
        null
      >;
      sendEmail: FunctionReference<
        "mutation",
        "internal",
        {
          bcc?: Array<string>;
          cc?: Array<string>;
          from: string;
          headers?: Array<{ name: string; value: string }>;
          html?: string;
          options: {
            apiKey: string;
            initialBackoffMs: number;
            onEmailEvent?: { fnHandle: string };
            retryAttempts: number;
            testMode: boolean;
          };
          replyTo?: Array<string>;
          subject?: string;
          template?: {
            id: string;
            variables?: Record<string, string | number>;
          };
          text?: string;
          to: Array<string>;
        },
        string
      >;
      updateManualEmail: FunctionReference<
        "mutation",
        "internal",
        {
          emailId: string;
          errorMessage?: string;
          resendId?: string;
          status:
            | "waiting"
            | "queued"
            | "cancelled"
            | "sent"
            | "delivered"
            | "delivery_delayed"
            | "bounced"
            | "failed";
        },
        null
      >;
    };
  };
};
