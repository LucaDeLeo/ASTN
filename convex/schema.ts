import { defineSchema } from "convex/server";
import { authTables } from "@convex-dev/auth/server";

// Auth tables + placeholder for opportunities (added in 01-02)
export default defineSchema({
  ...authTables,
});
