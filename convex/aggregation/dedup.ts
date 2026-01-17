import { stringSimilarity } from "string-similarity-js";

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeOrganization(org: string): string {
  return org
    .toLowerCase()
    .replace(/,?\s*(inc|llc|ltd|pbc|corp|corporation)\.?$/i, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function isSimilarOpportunity(
  a: { title: string; organization: string },
  b: { title: string; organization: string },
  threshold = 0.85
): boolean {
  const titleSimilarity = stringSimilarity(
    normalizeTitle(a.title),
    normalizeTitle(b.title)
  );

  const orgSimilarity = stringSimilarity(
    normalizeOrganization(a.organization),
    normalizeOrganization(b.organization)
  );

  // Both title and org must be similar
  return titleSimilarity > threshold && orgSimilarity > 0.8;
}
