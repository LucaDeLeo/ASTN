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
import type * as attendance_mutations from "../attendance/mutations.js";
import type * as attendance_queries from "../attendance/queries.js";
import type * as attendance_scheduler from "../attendance/scheduler.js";
import type * as careerActions_compute from "../careerActions/compute.js";
import type * as careerActions_mutations from "../careerActions/mutations.js";
import type * as careerActions_prompts from "../careerActions/prompts.js";
import type * as careerActions_queries from "../careerActions/queries.js";
import type * as careerActions_validation from "../careerActions/validation.js";
import type * as coworkingSpaces from "../coworkingSpaces.js";
import type * as crons from "../crons.js";
import type * as emails_batchActions from "../emails/batchActions.js";
import type * as emails_send from "../emails/send.js";
import type * as emails_templates from "../emails/templates.js";
import type * as engagement_compute from "../engagement/compute.js";
import type * as engagement_mutations from "../engagement/mutations.js";
import type * as engagement_prompts from "../engagement/prompts.js";
import type * as engagement_queries from "../engagement/queries.js";
import type * as engagement_validation from "../engagement/validation.js";
import type * as enrichment_conversation from "../enrichment/conversation.js";
import type * as enrichment_extraction from "../enrichment/extraction.js";
import type * as enrichment_queries from "../enrichment/queries.js";
import type * as enrichment_validation from "../enrichment/validation.js";
import type * as events_lumaClient from "../events/lumaClient.js";
import type * as events_mutations from "../events/mutations.js";
import type * as events_queries from "../events/queries.js";
import type * as events_sync from "../events/sync.js";
import type * as extraction_mutations from "../extraction/mutations.js";
import type * as extraction_pdf from "../extraction/pdf.js";
import type * as extraction_prompts from "../extraction/prompts.js";
import type * as extraction_queries from "../extraction/queries.js";
import type * as extraction_skills from "../extraction/skills.js";
import type * as extraction_text from "../extraction/text.js";
import type * as extraction_validation from "../extraction/validation.js";
import type * as guestBookings from "../guestBookings.js";
import type * as guestProfiles from "../guestProfiles.js";
import type * as http from "../http.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_bookingValidation from "../lib/bookingValidation.js";
import type * as lib_limits from "../lib/limits.js";
import type * as lib_logging from "../lib/logging.js";
import type * as lib_seedPlatformAdmin from "../lib/seedPlatformAdmin.js";
import type * as lib_slug from "../lib/slug.js";
import type * as matches from "../matches.js";
import type * as matching_compute from "../matching/compute.js";
import type * as matching_mutations from "../matching/mutations.js";
import type * as matching_prompts from "../matching/prompts.js";
import type * as matching_queries from "../matching/queries.js";
import type * as matching_validation from "../matching/validation.js";
import type * as notifications_mutations from "../notifications/mutations.js";
import type * as notifications_queries from "../notifications/queries.js";
import type * as notifications_realtime from "../notifications/realtime.js";
import type * as notifications_scheduler from "../notifications/scheduler.js";
import type * as opportunities from "../opportunities.js";
import type * as orgApplications from "../orgApplications.js";
import type * as organizations from "../organizations.js";
import type * as orgs_admin from "../orgs/admin.js";
import type * as orgs_directory from "../orgs/directory.js";
import type * as orgs_discovery from "../orgs/discovery.js";
import type * as orgs_members from "../orgs/members.js";
import type * as orgs_membership from "../orgs/membership.js";
import type * as orgs_queries from "../orgs/queries.js";
import type * as orgs_stats from "../orgs/stats.js";
import type * as profiles from "../profiles.js";
import type * as programs from "../programs.js";
import type * as skills from "../skills.js";
import type * as spaceBookings from "../spaceBookings.js";
import type * as spaceBookings_admin from "../spaceBookings/admin.js";
import type * as upload from "../upload.js";
import type * as userMigration from "../userMigration.js";

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
  "attendance/mutations": typeof attendance_mutations;
  "attendance/queries": typeof attendance_queries;
  "attendance/scheduler": typeof attendance_scheduler;
  "careerActions/compute": typeof careerActions_compute;
  "careerActions/mutations": typeof careerActions_mutations;
  "careerActions/prompts": typeof careerActions_prompts;
  "careerActions/queries": typeof careerActions_queries;
  "careerActions/validation": typeof careerActions_validation;
  coworkingSpaces: typeof coworkingSpaces;
  crons: typeof crons;
  "emails/batchActions": typeof emails_batchActions;
  "emails/send": typeof emails_send;
  "emails/templates": typeof emails_templates;
  "engagement/compute": typeof engagement_compute;
  "engagement/mutations": typeof engagement_mutations;
  "engagement/prompts": typeof engagement_prompts;
  "engagement/queries": typeof engagement_queries;
  "engagement/validation": typeof engagement_validation;
  "enrichment/conversation": typeof enrichment_conversation;
  "enrichment/extraction": typeof enrichment_extraction;
  "enrichment/queries": typeof enrichment_queries;
  "enrichment/validation": typeof enrichment_validation;
  "events/lumaClient": typeof events_lumaClient;
  "events/mutations": typeof events_mutations;
  "events/queries": typeof events_queries;
  "events/sync": typeof events_sync;
  "extraction/mutations": typeof extraction_mutations;
  "extraction/pdf": typeof extraction_pdf;
  "extraction/prompts": typeof extraction_prompts;
  "extraction/queries": typeof extraction_queries;
  "extraction/skills": typeof extraction_skills;
  "extraction/text": typeof extraction_text;
  "extraction/validation": typeof extraction_validation;
  guestBookings: typeof guestBookings;
  guestProfiles: typeof guestProfiles;
  http: typeof http;
  "lib/auth": typeof lib_auth;
  "lib/bookingValidation": typeof lib_bookingValidation;
  "lib/limits": typeof lib_limits;
  "lib/logging": typeof lib_logging;
  "lib/seedPlatformAdmin": typeof lib_seedPlatformAdmin;
  "lib/slug": typeof lib_slug;
  matches: typeof matches;
  "matching/compute": typeof matching_compute;
  "matching/mutations": typeof matching_mutations;
  "matching/prompts": typeof matching_prompts;
  "matching/queries": typeof matching_queries;
  "matching/validation": typeof matching_validation;
  "notifications/mutations": typeof notifications_mutations;
  "notifications/queries": typeof notifications_queries;
  "notifications/realtime": typeof notifications_realtime;
  "notifications/scheduler": typeof notifications_scheduler;
  opportunities: typeof opportunities;
  orgApplications: typeof orgApplications;
  organizations: typeof organizations;
  "orgs/admin": typeof orgs_admin;
  "orgs/directory": typeof orgs_directory;
  "orgs/discovery": typeof orgs_discovery;
  "orgs/members": typeof orgs_members;
  "orgs/membership": typeof orgs_membership;
  "orgs/queries": typeof orgs_queries;
  "orgs/stats": typeof orgs_stats;
  profiles: typeof profiles;
  programs: typeof programs;
  skills: typeof skills;
  spaceBookings: typeof spaceBookings;
  "spaceBookings/admin": typeof spaceBookings_admin;
  upload: typeof upload;
  userMigration: typeof userMigration;
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
