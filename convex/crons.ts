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

// Run daily at 7 AM UTC (after opportunity sync at 6 AM)
// Syncs events from lu.ma for orgs with API keys configured
crons.daily(
  "sync-luma-events",
  { hourUTC: 7, minuteUTC: 0 },
  internal.events.sync.runFullEventSync
);

// Run hourly to process match alerts for each timezone's 8 AM
// Each hour, users whose local time is 8 AM receive their alerts
crons.hourly(
  "send-match-alerts",
  { minuteUTC: 0 },
  internal.emails.batchActions.processMatchAlertBatch,
  {}
);

// Run weekly on Sunday evening UTC
// Covers Sunday afternoon/evening in Americas
crons.weekly(
  "send-weekly-digest",
  { dayOfWeek: "sunday", hourUTC: 22, minuteUTC: 0 },
  internal.emails.batchActions.processWeeklyDigestBatch,
  {}
);

export default crons;
