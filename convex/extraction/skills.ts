import { stringSimilarity } from "string-similarity-js";

// Threshold for fuzzy matching (0.7 = 70% similarity)
export const SIMILARITY_THRESHOLD = 0.7;

// Skill from taxonomy
interface TaxonomySkill {
  name: string;
  category: string;
  aliases?: Array<string>;
}

/**
 * Match raw skill strings from a document against the ASTN skills taxonomy.
 *
 * Matching priority:
 * 1. Exact match (case-insensitive): "Python" matches "Python"
 * 2. Alias match: "ML" matches "Machine Learning" if "ML" is in aliases
 * 3. Fuzzy match: "machine learning" matches "Machine Learning" if similarity >= threshold
 *
 * @param rawSkills - Skills extracted from document (as mentioned)
 * @param taxonomySkills - ASTN skills taxonomy with names, categories, and aliases
 * @returns Array of matched skill names from taxonomy (deduplicated)
 */
export function matchSkillsToTaxonomy(
  rawSkills: Array<string>,
  taxonomySkills: Array<TaxonomySkill>
): Array<string> {
  const matched = new Set<string>();

  for (const rawSkill of rawSkills) {
    const rawLower = rawSkill.toLowerCase().trim();
    if (!rawLower) continue;

    for (const taxSkill of taxonomySkills) {
      // Skip if already matched
      if (matched.has(taxSkill.name)) continue;

      // Priority 1: Exact match (case-insensitive)
      if (taxSkill.name.toLowerCase() === rawLower) {
        matched.add(taxSkill.name);
        continue;
      }

      // Priority 2: Alias match
      if (taxSkill.aliases?.some((alias) => alias.toLowerCase() === rawLower)) {
        matched.add(taxSkill.name);
        continue;
      }

      // Priority 3: Fuzzy match
      const similarity = stringSimilarity(rawSkill, taxSkill.name);
      if (similarity >= SIMILARITY_THRESHOLD) {
        matched.add(taxSkill.name);
      }
    }
  }

  return Array.from(matched);
}
