"use node";
import { internalAction } from "../_generated/server";

// Airtable API access provided by aisafety.com team
const AIRTABLE_API_KEY = process.env.AISAFETY_AIRTABLE_API_KEY || "";
const AIRTABLE_BASE_ID = process.env.AISAFETY_AIRTABLE_BASE_ID || "";
const AIRTABLE_TABLE_NAME = process.env.AISAFETY_AIRTABLE_TABLE_NAME || "Jobs";

type AirtableRecord = {
  id: string;
  fields: {
    Title?: string;
    Organization?: string;
    Location?: string;
    Remote?: boolean;
    Description?: string;
    Requirements?: string;
    "Application URL"?: string;
    "Role Type"?: string;
    Salary?: string;
    Deadline?: string;
  };
};

type NormalizedOpportunity = {
  sourceId: string;
  source: "aisafety_com";
  title: string;
  organization: string;
  location: string;
  isRemote: boolean;
  roleType: string;
  experienceLevel?: string;
  description: string;
  requirements?: Array<string>;
  salaryRange?: string;
  deadline?: number;
  sourceUrl: string;
};

export const fetchOpportunities = internalAction({
  args: {},
  handler: async (): Promise<Array<NormalizedOpportunity>> => {
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      console.error("Missing aisafety.com Airtable credentials");
      return [];
    }

    const results: Array<AirtableRecord> = [];
    let offset: string | undefined;

    try {
      // Paginate through all records
      do {
        const url = new URL(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`
        );
        if (offset) {
          url.searchParams.set("offset", offset);
        }
        url.searchParams.set("pageSize", "100");

        const response = await fetch(url.toString(), {
          headers: {
            Authorization: `Bearer ${AIRTABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(
            `Airtable API error: ${response.status} ${response.statusText}`
          );
        }

        const data = (await response.json()) as {
          records: Array<AirtableRecord>;
          offset?: string;
        };
        results.push(...data.records);
        offset = data.offset;

        // Rate limiting: Airtable allows 5 requests/second
        if (offset) {
          await new Promise((resolve) => setTimeout(resolve, 250));
        }
      } while (offset);

      console.log(
        `Fetched ${results.length} opportunities from aisafety.com Airtable`
      );

      return results
        .filter((record) => record.fields.Title)
        .map((record) => normalizeAirtableRecord(record));
    } catch (error) {
      console.error("Error fetching from aisafety.com Airtable:", error);
      return [];
    }
  },
});

function normalizeAirtableRecord(record: AirtableRecord): NormalizedOpportunity {
  const fields = record.fields;

  return {
    sourceId: `aisafety-${record.id}`,
    source: "aisafety_com",
    title: fields.Title || "Untitled",
    organization: fields.Organization || "Unknown",
    location: fields.Location || "Remote",
    isRemote:
      fields.Remote ?? fields.Location?.toLowerCase().includes("remote") ?? false,
    roleType: mapRoleType(fields["Role Type"] || fields.Title || ""),
    description: fields.Description || "",
    requirements: fields.Requirements
      ? fields.Requirements.split("\n").filter(Boolean)
      : undefined,
    salaryRange: fields.Salary,
    deadline: fields.Deadline
      ? new Date(fields.Deadline).getTime()
      : undefined,
    sourceUrl: fields["Application URL"] || `https://www.aisafety.com/jobs`,
  };
}

function mapRoleType(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("research")) return "research";
  if (
    lower.includes("engineer") ||
    lower.includes("developer") ||
    lower.includes("software")
  )
    return "engineering";
  if (
    lower.includes("operations") ||
    lower.includes("ops") ||
    lower.includes("coordinator")
  )
    return "operations";
  if (lower.includes("policy") || lower.includes("governance")) return "policy";
  return "other";
}
