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
import type * as enrichment_conversation from "../enrichment/conversation.js";
import type * as enrichment_queries from "../enrichment/queries.js";
import type * as http from "../http.js";
import type * as opportunities from "../opportunities.js";
import type * as organizations from "../organizations.js";
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
  "enrichment/conversation": typeof enrichment_conversation;
  "enrichment/queries": typeof enrichment_queries;
  http: typeof http;
  opportunities: typeof opportunities;
  organizations: typeof organizations;
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

export declare const components: {};
