"use node";
import { internalAction } from "../_generated/server";
import { algoliasearch } from "algoliasearch";

// 80K Hours uses Algolia for their job board search
// Credentials discovered from page source (public frontend keys)
// These may need updating if 80K Hours rotates their keys
const ALGOLIA_APP_ID = process.env.EIGHTY_K_ALGOLIA_APP_ID || "";
const ALGOLIA_API_KEY = process.env.EIGHTY_K_ALGOLIA_API_KEY || "";
const ALGOLIA_INDEX = "jobs_prod_super_ranked";

type AlgoliaHit = {
  objectID: string;
  title: string;
  company_name: string;
  location?: string;
  remote?: boolean;
  job_type?: string;
  experience_required?: string;
  description_short?: string;
  description?: string;
  requirements?: string[];
  salary_text?: string;
  closing_date?: string;
  posted_date?: string;
  url: string;
};

type NormalizedOpportunity = {
  sourceId: string;
  source: "80k_hours";
  title: string;
  organization: string;
  location: string;
  isRemote: boolean;
  roleType: string;
  experienceLevel?: string;
  description: string;
  requirements?: string[];
  salaryRange?: string;
  deadline?: number;
  sourceUrl: string;
  postedAt?: number;
};

export const fetchOpportunities = internalAction({
  args: {},
  handler: async (): Promise<NormalizedOpportunity[]> => {
    if (!ALGOLIA_APP_ID || !ALGOLIA_API_KEY) {
      console.error("Missing 80K Hours Algolia credentials");
      return [];
    }

    const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_API_KEY);

    const results: AlgoliaHit[] = [];
    let page = 0;
    let hasMore = true;

    try {
      while (hasMore) {
        const response = await client.searchSingleIndex({
          indexName: ALGOLIA_INDEX,
          searchParams: {
            query: "",
            page,
            hitsPerPage: 100,
          },
        });

        results.push(...(response.hits as AlgoliaHit[]));
        hasMore = page < (response.nbPages ?? 1) - 1;
        page++;

        // Rate limiting: 1 second between requests
        if (hasMore) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      console.log(`Fetched ${results.length} opportunities from 80K Hours`);
      return results.map(normalizeEightyKJob);
    } catch (error) {
      console.error("Error fetching from 80K Hours:", error);
      return [];
    }
  },
});

function normalizeEightyKJob(hit: AlgoliaHit): NormalizedOpportunity {
  return {
    sourceId: `80k-${hit.objectID}`,
    source: "80k_hours",
    title: hit.title || "Untitled",
    organization: hit.company_name || "Unknown Organization",
    location: hit.location || "Location not specified",
    isRemote:
      hit.remote ?? hit.location?.toLowerCase().includes("remote") ?? false,
    roleType: mapRoleType(hit.job_type),
    experienceLevel: mapExperienceLevel(hit.experience_required),
    description: hit.description || hit.description_short || "",
    requirements: hit.requirements,
    salaryRange: hit.salary_text,
    deadline: hit.closing_date
      ? new Date(hit.closing_date).getTime()
      : undefined,
    sourceUrl: hit.url,
    postedAt: hit.posted_date
      ? new Date(hit.posted_date).getTime()
      : undefined,
  };
}

function mapRoleType(jobType?: string): string {
  if (!jobType) return "other";
  const lower = jobType.toLowerCase();
  if (lower.includes("research")) return "research";
  if (
    lower.includes("engineer") ||
    lower.includes("software") ||
    lower.includes("technical")
  )
    return "engineering";
  if (
    lower.includes("operations") ||
    lower.includes("ops") ||
    lower.includes("admin")
  )
    return "operations";
  if (lower.includes("policy") || lower.includes("governance")) return "policy";
  return "other";
}

function mapExperienceLevel(exp?: string): string | undefined {
  if (!exp) return undefined;
  const lower = exp.toLowerCase();
  if (lower.includes("entry") || lower.includes("junior") || lower.includes("0-2"))
    return "entry";
  if (lower.includes("mid") || lower.includes("2-5") || lower.includes("3-5"))
    return "mid";
  if (lower.includes("senior") || lower.includes("5+") || lower.includes("5-10"))
    return "senior";
  if (
    lower.includes("lead") ||
    lower.includes("principal") ||
    lower.includes("director")
  )
    return "lead";
  return undefined;
}
