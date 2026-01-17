import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run daily at 6 AM UTC
// This syncs opportunities from 80K Hours and aisafety.com
crons.daily(
  "sync-opportunities",
  { hourUTC: 6, minuteUTC: 0 },
  internal.aggregation.sync.runFullSync
);

export default crons;
