import { v } from "convex/values";
import { Resend } from "@convex-dev/resend";
import { internalMutation } from "../_generated/server";
import { components } from "../_generated/api";

// Initialize Resend component
// For production: set RESEND_API_KEY in Convex dashboard
// For local development: testMode prevents actual email sending
export const resend = new Resend(components.resend, {
  // testMode: process.env.NODE_ENV !== "production",
});

// From address for all ASTN emails
const FROM_ADDRESS = "ASTN <notifications@astn.ai>";

/**
 * Send a match alert email
 * Called by the notification scheduler when new great-tier matches are found
 */
export const sendMatchAlert = internalMutation({
  args: {
    to: v.string(),
    subject: v.string(),
    html: v.string(),
  },
  handler: async (ctx, { to, subject, html }) => {
    await resend.sendEmail(ctx, {
      from: FROM_ADDRESS,
      to,
      subject,
      html,
    });
  },
});

/**
 * Send a weekly digest email
 * Called by the weekly cron job for users with digest enabled
 */
export const sendWeeklyDigest = internalMutation({
  args: {
    to: v.string(),
    subject: v.string(),
    html: v.string(),
  },
  handler: async (ctx, { to, subject, html }) => {
    await resend.sendEmail(ctx, {
      from: FROM_ADDRESS,
      to,
      subject,
      html,
    });
  },
});
