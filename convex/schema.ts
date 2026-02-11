import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

// Legacy auth tables (from @convex-dev/auth) — kept temporarily for user ID migration.
// Remove after all users have migrated to Clerk IDs.
const legacyAuthTables = {
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
  }).index('email', ['email']),
  authSessions: defineTable({
    userId: v.id('users'),
    expirationTime: v.number(),
  }).index('userId', ['userId']),
  authAccounts: defineTable({
    userId: v.id('users'),
    provider: v.string(),
    providerAccountId: v.string(),
    secret: v.optional(v.string()),
    emailVerified: v.optional(v.string()),
    phoneVerified: v.optional(v.string()),
  })
    .index('providerAndAccountId', ['provider', 'providerAccountId'])
    .index('userId', ['userId']),
  authRefreshTokens: defineTable({
    sessionId: v.id('authSessions'),
    expirationTime: v.number(),
    firstUsedTime: v.optional(v.number()),
    parentRefreshTokenId: v.optional(v.id('authRefreshTokens')),
  }).index('sessionId', ['sessionId']),
  authVerificationCodes: defineTable({
    accountId: v.id('authAccounts'),
    provider: v.string(),
    code: v.string(),
    expirationTime: v.number(),
    verifier: v.optional(v.string()),
    emailVerified: v.optional(v.string()),
    phoneVerified: v.optional(v.string()),
  })
    .index('accountId', ['accountId'])
    .index('code', ['code']),
  authVerifiers: defineTable({
    sessionId: v.optional(v.id('authSessions')),
    signature: v.optional(v.string()),
  }),
  authRateLimits: defineTable({
    identifier: v.string(),
    numAttempts: v.number(),
    lastAttemptTime: v.number(),
  }).index('identifier', ['identifier']),
}

export default defineSchema({
  ...legacyAuthTables,

  // Profile tables
  profiles: defineTable({
    userId: v.string(),

    // Basic info
    name: v.optional(v.string()),
    pronouns: v.optional(v.string()),
    location: v.optional(v.string()),
    headline: v.optional(v.string()),

    // Education (array of entries)
    education: v.optional(
      v.array(
        v.object({
          institution: v.string(),
          degree: v.optional(v.string()),
          field: v.optional(v.string()),
          startYear: v.optional(v.number()),
          endYear: v.optional(v.number()),
          current: v.optional(v.boolean()),
        }),
      ),
    ),

    // Work history (array of entries)
    workHistory: v.optional(
      v.array(
        v.object({
          organization: v.string(),
          title: v.string(),
          startDate: v.optional(v.number()), // Unix timestamp
          endDate: v.optional(v.number()), // Unix timestamp
          current: v.optional(v.boolean()),
          description: v.optional(v.string()),
        }),
      ),
    ),

    // Skills (from taxonomy)
    skills: v.optional(v.array(v.string())),

    // Career goals and interests
    careerGoals: v.optional(v.string()),
    aiSafetyInterests: v.optional(v.array(v.string())),
    seeking: v.optional(v.string()),

    // LLM-generated content
    enrichmentSummary: v.optional(v.string()),
    hasEnrichmentConversation: v.optional(v.boolean()),

    // Privacy settings (section-level)
    privacySettings: v.optional(
      v.object({
        defaultVisibility: v.union(
          v.literal('public'),
          v.literal('connections'),
          v.literal('private'),
        ),
        sectionVisibility: v.optional(
          v.object({
            basicInfo: v.optional(v.string()),
            education: v.optional(v.string()),
            workHistory: v.optional(v.string()),
            skills: v.optional(v.string()),
            careerGoals: v.optional(v.string()),
          }),
        ),
        hiddenFromOrgs: v.optional(v.array(v.string())),
        locationDiscoverable: v.optional(v.boolean()), // Opt-in for location-based org suggestions
        attendancePrivacyDefaults: v.optional(
          v.object({
            showOnProfile: v.boolean(), // Whether attendance appears on profile
            showToOtherOrgs: v.boolean(), // Whether non-host orgs can see attendance
          }),
        ),
      }),
    ),

    // Match staleness tracking (set when match-affecting fields change)
    matchesStaleAt: v.optional(v.number()),

    // Completeness tracking
    completedSections: v.optional(v.array(v.string())),

    // Notification preferences (for email alerts and digests)
    notificationPreferences: v.optional(
      v.object({
        matchAlerts: v.object({
          enabled: v.boolean(),
        }),
        weeklyDigest: v.object({
          enabled: v.boolean(),
        }),
        timezone: v.string(), // IANA timezone, e.g., "America/New_York"
      }),
    ),

    // Event notification preferences (for event announcements and reminders)
    eventNotificationPreferences: v.optional(
      v.object({
        frequency: v.union(
          v.literal('all'),
          v.literal('daily'),
          v.literal('weekly'),
          v.literal('none'),
        ),
        reminderTiming: v.optional(
          v.object({
            oneWeekBefore: v.boolean(),
            oneDayBefore: v.boolean(),
            oneHourBefore: v.boolean(),
          }),
        ),
        mutedOrgIds: v.optional(v.array(v.id('organizations'))),
      }),
    ),

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_user', ['userId']),

  // Enrichment conversation messages
  enrichmentMessages: defineTable({
    profileId: v.id('profiles'),
    role: v.union(v.literal('user'), v.literal('assistant')),
    content: v.string(),
    actionId: v.optional(v.id('careerActions')), // Links to completed action for completion chat
    createdAt: v.number(),
  })
    .index('by_profile', ['profileId', 'createdAt'])
    .index('by_action', ['actionId', 'createdAt']),

  // Extractions from enrichment (pending review)
  enrichmentExtractions: defineTable({
    profileId: v.id('profiles'),
    field: v.string(),
    extractedValue: v.string(),
    status: v.union(
      v.literal('pending'),
      v.literal('accepted'),
      v.literal('rejected'),
      v.literal('edited'),
    ),
    editedValue: v.optional(v.string()),
    createdAt: v.number(),
  }).index('by_profile', ['profileId']),

  // Uploaded documents (resumes, CVs) for data extraction
  uploadedDocuments: defineTable({
    userId: v.string(), // Owner of the document
    storageId: v.id('_storage'), // Reference to Convex storage
    fileName: v.string(), // Original filename
    fileSize: v.number(), // Size in bytes
    mimeType: v.string(), // e.g., "application/pdf"
    status: v.union(
      v.literal('pending_extraction'),
      v.literal('extracting'),
      v.literal('extracted'),
      v.literal('failed'),
    ),
    uploadedAt: v.number(), // Unix timestamp
    errorMessage: v.optional(v.string()), // For failed status
    // Extracted data from LLM (stored for user review before applying to profile)
    extractedData: v.optional(
      v.object({
        name: v.optional(v.string()),
        email: v.optional(v.string()),
        location: v.optional(v.string()),
        education: v.optional(
          v.array(
            v.object({
              institution: v.string(),
              degree: v.optional(v.string()),
              field: v.optional(v.string()),
              startYear: v.optional(v.number()),
              endYear: v.optional(v.number()),
              current: v.optional(v.boolean()),
            }),
          ),
        ),
        workHistory: v.optional(
          v.array(
            v.object({
              organization: v.string(),
              title: v.string(),
              startDate: v.optional(v.string()), // YYYY-MM format from LLM
              endDate: v.optional(v.string()), // YYYY-MM format or "present"
              current: v.optional(v.boolean()),
              description: v.optional(v.string()),
            }),
          ),
        ),
        skills: v.optional(v.array(v.string())), // Matched ASTN skill names
        rawSkills: v.optional(v.array(v.string())), // Original skills from document
      }),
    ),
  })
    .index('by_user', ['userId'])
    .index('by_status', ['status']),

  // Skills taxonomy
  skillsTaxonomy: defineTable({
    name: v.string(),
    category: v.string(),
    description: v.optional(v.string()),
    aliases: v.optional(v.array(v.string())),
  })
    .index('by_category', ['category'])
    .searchIndex('search_name', {
      searchField: 'name',
      filterFields: ['category'],
    }),

  // Organizations (for privacy selection and future features)
  organizations: defineTable({
    name: v.string(),
    slug: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    logoStorageId: v.optional(v.id('_storage')), // Convex storage reference for uploaded logo
    description: v.optional(v.string()), // Brief org description for display
    city: v.optional(v.string()), // e.g., "Buenos Aires", "San Francisco"
    country: v.optional(v.string()), // e.g., "Argentina", "United States"
    coordinates: v.optional(v.object({ lat: v.number(), lng: v.number() })), // For map display
    isGlobal: v.optional(v.boolean()), // True for orgs without specific location
    hasCoworkingSpace: v.optional(v.boolean()), // Denormalized flag for quick checks
    memberCount: v.optional(v.number()), // Denormalized for display

    // Phase 31: Self-configuration fields
    contactEmail: v.optional(v.string()),
    website: v.optional(v.string()),
    socialLinks: v.optional(
      v.array(
        v.object({
          platform: v.string(), // "twitter", "linkedin", "github", "discord", etc.
          url: v.string(),
        }),
      ),
    ),

    // Lu.ma integration for events
    lumaCalendarUrl: v.optional(v.string()), // Public calendar URL (e.g., "https://lu.ma/baish") for embed
    lumaApiKey: v.optional(v.string()), // API key for sync (requires Luma Plus)
    eventsLastSynced: v.optional(v.number()), // Timestamp of last sync
  })
    .index('by_name', ['name'])
    .index('by_slug', ['slug'])
    .index('by_country', ['country'])
    .index('by_city_country', ['city', 'country'])
    .searchIndex('search_name', {
      searchField: 'name',
    }),

  // Organization memberships
  orgMemberships: defineTable({
    userId: v.string(),
    orgId: v.id('organizations'),
    role: v.union(v.literal('admin'), v.literal('member')),
    directoryVisibility: v.union(v.literal('visible'), v.literal('hidden')),
    joinedAt: v.number(),
    invitedBy: v.optional(v.id('orgMemberships')),
  })
    .index('by_user', ['userId'])
    .index('by_org', ['orgId'])
    .index('by_org_role', ['orgId', 'role']),

  // Organization invite links
  orgInviteLinks: defineTable({
    orgId: v.id('organizations'),
    token: v.string(), // Unique invite token (UUID)
    createdBy: v.id('orgMemberships'),
    createdAt: v.number(),
    expiresAt: v.optional(v.number()), // Optional expiration
  })
    .index('by_token', ['token'])
    .index('by_org', ['orgId']),

  // Co-working spaces (Phase 31)
  coworkingSpaces: defineTable({
    orgId: v.id('organizations'),
    name: v.string(), // e.g., "Main Co-working Space"
    capacity: v.number(), // Max people per day
    timezone: v.string(), // IANA timezone, e.g., "America/Argentina/Buenos_Aires"

    // Operating hours: array of 7 objects (0=Sunday through 6=Saturday)
    operatingHours: v.array(
      v.object({
        dayOfWeek: v.number(), // 0-6 (Sunday-Saturday)
        openMinutes: v.number(), // Minutes from midnight (e.g., 540 = 9:00 AM)
        closeMinutes: v.number(), // Minutes from midnight (e.g., 1080 = 6:00 PM)
        isClosed: v.boolean(), // True if closed this day
      }),
    ),

    // Guest access configuration
    guestAccessEnabled: v.boolean(), // Whether guests can apply to visit

    // Custom visit application fields (Phase 33 renders these)
    customVisitFields: v.optional(
      v.array(
        v.object({
          fieldId: v.string(), // Unique ID for this field (e.g., "project", "dietary")
          label: v.string(), // Display label
          type: v.union(
            v.literal('text'),
            v.literal('textarea'),
            v.literal('select'),
            v.literal('checkbox'),
          ),
          required: v.boolean(),
          options: v.optional(v.array(v.string())), // For select type
          placeholder: v.optional(v.string()),
        }),
      ),
    ),

    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_org', ['orgId']),

  // Space bookings (Phase 32)
  spaceBookings: defineTable({
    spaceId: v.id('coworkingSpaces'),
    userId: v.string(),

    // Date and time
    date: v.string(), // ISO date string e.g. "2026-02-15"
    startMinutes: v.number(), // Minutes from midnight (e.g., 600 = 10:00 AM)
    endMinutes: v.number(), // Minutes from midnight (e.g., 900 = 3:00 PM)

    // Booking type (member now, guest in Phase 33)
    bookingType: v.union(v.literal('member'), v.literal('guest')),

    // Status: members auto-confirm, guests go through approval
    status: v.union(
      v.literal('confirmed'),
      v.literal('cancelled'),
      v.literal('pending'), // For guests (Phase 33)
      v.literal('rejected'), // For guests (Phase 33)
    ),

    // Optional tags
    workingOn: v.optional(v.string()), // Max 140 chars, enforced in mutation
    interestedInMeeting: v.optional(v.string()), // Max 140 chars

    // Consent for attendee visibility (required for booking)
    consentToProfileSharing: v.boolean(),

    // Guest approval fields (Phase 33)
    approvedBy: v.optional(v.id('orgMemberships')),
    approvedAt: v.optional(v.number()),
    rejectionReason: v.optional(v.string()),

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
    cancelledAt: v.optional(v.number()),
  })
    .index('by_space_date', ['spaceId', 'date'])
    .index('by_user', ['userId'])
    .index('by_space_user', ['spaceId', 'userId']),

  // Career actions (LLM-generated personalized career steps)
  careerActions: defineTable({
    profileId: v.id('profiles'),
    type: v.union(
      v.literal('replicate'),
      v.literal('collaborate'),
      v.literal('start_org'),
      v.literal('identify_gaps'),
      v.literal('volunteer'),
      v.literal('build_tools'),
      v.literal('teach_write'),
      v.literal('develop_skills'),
    ),
    title: v.string(),
    description: v.string(),
    rationale: v.string(), // User-facing reasoning referencing profile elements
    profileBasis: v.optional(v.array(v.string())), // Machine-readable profile signal identifiers (GEN-07)
    status: v.union(
      v.literal('active'),
      v.literal('saved'),
      v.literal('dismissed'),
      v.literal('in_progress'),
      v.literal('done'),
    ),
    generatedAt: v.number(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    modelVersion: v.string(),
    completionConversationStarted: v.optional(v.boolean()), // Phase 36 flag
  })
    .index('by_profile', ['profileId'])
    .index('by_profile_status', ['profileId', 'status']),

  // Match results (per CONTEXT.md: tier labels, not percentages)
  matches: defineTable({
    profileId: v.id('profiles'),
    opportunityId: v.id('opportunities'),

    // Scoring (tier labels not percentages per CONTEXT.md)
    tier: v.union(
      v.literal('great'),
      v.literal('good'),
      v.literal('exploring'),
    ),
    score: v.number(), // 0-100 internal score for sorting within tier

    // User-controlled status for swipe actions
    status: v.optional(
      v.union(v.literal('active'), v.literal('dismissed'), v.literal('saved')),
    ),

    // Explanation (MATCH-02: bullet points with strengths + actionable gap)
    explanation: v.object({
      strengths: v.array(v.string()), // 2-4 bullet points on why this fits
      gap: v.optional(v.string()), // One actionable thing to strengthen application
    }),

    // Probability (MATCH-03: dual framing with experimental label)
    probability: v.object({
      interviewChance: v.string(), // "Strong chance", "Good chance", "Moderate chance"
      ranking: v.string(), // "Top 10%", "Top 20%", etc.
      confidence: v.string(), // "HIGH", "MEDIUM", "LOW"
    }),

    // Recommendations (MATCH-04: 1 specific + 1-2 general per match)
    recommendations: v.array(
      v.object({
        type: v.union(
          v.literal('specific'),
          v.literal('skill'),
          v.literal('experience'),
        ),
        action: v.string(),
        priority: v.union(
          v.literal('high'),
          v.literal('medium'),
          v.literal('low'),
        ),
      }),
    ),

    // Metadata
    isNew: v.boolean(), // For "new high-fit" prioritization
    computedAt: v.number(),
    modelVersion: v.string(), // Track which model version generated this
  })
    .index('by_profile', ['profileId'])
    .index('by_profile_tier', ['profileId', 'tier'])
    .index('by_opportunity', ['opportunityId'])
    .index('by_profile_new', ['profileId', 'isNew']),

  // Opportunities
  opportunities: defineTable({
    // Identity
    sourceId: v.string(), // Unique per source: "80k-123", "aisafety-abc", "manual-uuid"
    source: v.union(
      v.literal('80k_hours'),
      v.literal('aisafety_com'),
      v.literal('manual'),
    ),

    // Core fields
    title: v.string(),
    organization: v.string(),
    organizationLogoUrl: v.optional(v.string()),
    location: v.string(),
    isRemote: v.boolean(),
    roleType: v.string(), // "research", "engineering", "operations", "policy", "other"
    experienceLevel: v.optional(v.string()), // "entry", "mid", "senior", "lead"
    description: v.string(),
    requirements: v.optional(v.array(v.string())),
    salaryRange: v.optional(v.string()),
    deadline: v.optional(v.number()), // Unix timestamp

    // Source tracking
    sourceUrl: v.string(),
    alternateSources: v.optional(
      v.array(
        v.object({
          sourceId: v.string(),
          source: v.string(),
          sourceUrl: v.string(),
        }),
      ),
    ),

    // Status and timestamps
    status: v.union(v.literal('active'), v.literal('archived')),
    lastVerified: v.number(), // For freshness indicator (OPPS-06)
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_source_id', ['sourceId'])
    .index('by_organization', ['organization'])
    .index('by_status', ['status'])
    .index('by_role_type', ['roleType', 'status'])
    .index('by_location', ['isRemote', 'status'])
    .searchIndex('search_title', {
      searchField: 'title',
      filterFields: ['status', 'roleType', 'isRemote'],
    }),

  // Events (synced from lu.ma)
  events: defineTable({
    orgId: v.id('organizations'),
    lumaEventId: v.string(), // lu.ma event ID (e.g., "evt-abc123")

    // Core fields from lu.ma API
    title: v.string(),
    description: v.optional(v.string()),
    startAt: v.number(), // Unix timestamp
    endAt: v.optional(v.number()), // Unix timestamp
    timezone: v.string(), // IANA timezone
    coverUrl: v.optional(v.string()), // Event cover image
    url: v.string(), // lu.ma event URL for RSVP link-out

    // Location (can be virtual or physical)
    location: v.optional(v.string()), // Address or "Online"
    isVirtual: v.boolean(), // True if online event

    // Metadata
    syncedAt: v.number(),
  })
    .index('by_org', ['orgId'])
    .index('by_org_start', ['orgId', 'startAt'])
    .index('by_luma_id', ['lumaEventId']),

  // Platform admins (super-admins who can approve/reject org applications)
  platformAdmins: defineTable({
    userId: v.string(),
    addedAt: v.number(),
    addedBy: v.optional(v.string()), // userId of who added them, null for seed
  }).index('by_user', ['userId']),

  // Org applications (organizations applying to join the platform)
  orgApplications: defineTable({
    // Applicant info
    applicantUserId: v.string(),
    applicantName: v.string(),
    applicantEmail: v.string(),

    // Org info from application
    orgName: v.string(),
    orgNameNormalized: v.optional(v.string()), // Lowercase/trimmed for case-insensitive duplicate detection
    description: v.string(),
    city: v.string(),
    country: v.string(),
    website: v.optional(v.string()),
    reasonForJoining: v.optional(v.string()), // Made optional - field removed from UI

    // Status machine: pending -> approved | rejected | withdrawn
    status: v.union(
      v.literal('pending'),
      v.literal('approved'),
      v.literal('rejected'),
      v.literal('withdrawn'),
    ),
    rejectionReason: v.optional(v.string()),

    // Review tracking
    reviewedBy: v.optional(v.string()), // platform admin userId
    reviewedAt: v.optional(v.number()),

    // Metadata
    createdAt: v.number(),
  })
    .index('by_applicant', ['applicantUserId'])
    .index('by_status', ['status'])
    .index('by_orgName', ['orgName'])
    .index('by_orgNameNormalized', ['orgNameNormalized']),

  // In-app notifications (bell icon notification center)
  notifications: defineTable({
    userId: v.string(),
    type: v.union(
      v.literal('event_new'),
      v.literal('event_reminder'),
      v.literal('event_updated'),
      v.literal('attendance_prompt'),
      v.literal('org_application_approved'),
      v.literal('org_application_rejected'),
      v.literal('booking_confirmed'),
      v.literal('guest_visit_approved'),
      v.literal('guest_visit_rejected'),
      v.literal('guest_visit_pending'),
    ),
    eventId: v.optional(v.id('events')),
    orgId: v.optional(v.id('organizations')),
    spaceBookingId: v.optional(v.id('spaceBookings')),
    applicationId: v.optional(v.id('orgApplications')),
    title: v.string(),
    body: v.string(),
    actionUrl: v.optional(v.string()),
    read: v.boolean(),
    createdAt: v.number(),
    // For attendance prompts
    promptNumber: v.optional(v.number()), // 1 or 2
    respondedAt: v.optional(v.number()), // When user responded
  })
    .index('by_user', ['userId'])
    .index('by_user_read', ['userId', 'read']),

  // Event view tracking (for reminder audience - users who viewed an event)
  eventViews: defineTable({
    userId: v.string(),
    eventId: v.id('events'),
    viewedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_event', ['eventId'])
    .index('by_user_event', ['userId', 'eventId']),

  // Scheduled reminders (for cancellation when events change)
  scheduledReminders: defineTable({
    eventId: v.id('events'),
    userId: v.string(),
    timing: v.union(
      v.literal('1_week'),
      v.literal('1_day'),
      v.literal('1_hour'),
    ),
    scheduledFunctionId: v.string(),
    scheduledFor: v.number(),
  })
    .index('by_event', ['eventId'])
    .index('by_user_event', ['userId', 'eventId']),

  // Attendance records (post-event confirmation and feedback)
  attendance: defineTable({
    userId: v.string(),
    eventId: v.id('events'),
    orgId: v.id('organizations'), // Denormalized for privacy queries

    // Response
    status: v.union(
      v.literal('attended'),
      v.literal('partial'),
      v.literal('not_attended'),
      v.literal('unknown'),
    ),
    respondedAt: v.optional(v.number()),

    // Feedback (optional)
    feedbackRating: v.optional(v.number()), // 1-5 stars
    feedbackText: v.optional(v.string()),
    feedbackSubmittedAt: v.optional(v.number()),

    // Privacy
    showOnProfile: v.boolean(),
    showToOtherOrgs: v.boolean(),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_event', ['eventId'])
    .index('by_org', ['orgId'])
    .index('by_user_event', ['userId', 'eventId']),

  // Scheduled attendance prompts (for tracking and deduplication)
  scheduledAttendancePrompts: defineTable({
    eventId: v.id('events'),
    userId: v.string(),
    scheduledFunctionId: v.string(),
    scheduledFor: v.number(),
    promptNumber: v.number(), // 1 or 2
  })
    .index('by_event', ['eventId'])
    .index('by_user_event', ['userId', 'eventId']),

  // Member engagement levels (per user-org pair)
  memberEngagement: defineTable({
    userId: v.string(),
    orgId: v.id('organizations'),

    // Computed engagement level
    level: v.union(
      v.literal('highly_engaged'),
      v.literal('moderate'),
      v.literal('at_risk'),
      v.literal('new'),
      v.literal('inactive'),
    ),

    // Explanations from LLM
    adminExplanation: v.string(), // Detailed with signals for admins
    userExplanation: v.string(), // Friendly messaging for users

    // Input signals (stored for audit/debugging)
    signals: v.object({
      eventsAttended90d: v.number(),
      lastAttendedAt: v.optional(v.number()),
      rsvpCount90d: v.number(),
      profileUpdatedAt: v.optional(v.number()),
      joinedAt: v.number(),
    }),

    // Override (optional - only set when admin overrides)
    override: v.optional(
      v.object({
        level: v.union(
          v.literal('highly_engaged'),
          v.literal('moderate'),
          v.literal('at_risk'),
          v.literal('new'),
          v.literal('inactive'),
        ),
        notes: v.string(),
        overriddenBy: v.id('orgMemberships'),
        overriddenAt: v.number(),
        expiresAt: v.optional(v.number()),
      }),
    ),

    // Metadata
    computedAt: v.number(),
    modelVersion: v.string(),
  })
    .index('by_user_org', ['userId', 'orgId'])
    .index('by_org', ['orgId'])
    .index('by_org_level', ['orgId', 'level']),

  // Engagement override history (audit trail)
  engagementOverrideHistory: defineTable({
    engagementId: v.id('memberEngagement'),
    userId: v.string(),
    orgId: v.id('organizations'),

    previousLevel: v.string(),
    newLevel: v.string(),
    notes: v.string(),

    action: v.union(v.literal('override'), v.literal('clear')),
    performedBy: v.id('orgMemberships'),
    performedAt: v.number(),
  })
    .index('by_engagement', ['engagementId'])
    .index('by_org', ['orgId']),

  // Programs (org-specific activities like reading groups, fellowships)
  programs: defineTable({
    orgId: v.id('organizations'),

    // Identity
    name: v.string(),
    slug: v.string(), // URL-safe identifier within org
    description: v.optional(v.string()),

    // Program type
    type: v.union(
      v.literal('reading_group'),
      v.literal('fellowship'),
      v.literal('mentorship'),
      v.literal('cohort'),
      v.literal('workshop_series'),
      v.literal('custom'),
    ),

    // Dates
    startDate: v.optional(v.number()), // Unix timestamp
    endDate: v.optional(v.number()),
    status: v.union(
      v.literal('planning'),
      v.literal('active'),
      v.literal('completed'),
      v.literal('archived'),
    ),

    // Enrollment configuration
    enrollmentMethod: v.union(
      v.literal('admin_only'), // Only admins can add members
      v.literal('self_enroll'), // Members can join freely
      v.literal('approval_required'), // Members request, admin approves
    ),
    maxParticipants: v.optional(v.number()),

    // Completion criteria (optional)
    completionCriteria: v.optional(
      v.object({
        type: v.union(
          v.literal('attendance_count'),
          v.literal('attendance_percentage'),
          v.literal('manual'),
        ),
        requiredCount: v.optional(v.number()), // For attendance_count
        requiredPercentage: v.optional(v.number()), // For attendance_percentage
      }),
    ),

    // Linked events (for auto-attendance counting)
    linkedEventIds: v.optional(v.array(v.id('events'))),

    // Metadata
    createdBy: v.id('orgMemberships'),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_org', ['orgId'])
    .index('by_org_status', ['orgId', 'status'])
    .index('by_org_slug', ['orgId', 'slug']),

  // Program participation tracking
  programParticipation: defineTable({
    programId: v.id('programs'),
    userId: v.string(),
    orgId: v.id('organizations'), // Denormalized for queries

    // Enrollment status
    status: v.union(
      v.literal('pending'), // Requested, awaiting approval
      v.literal('enrolled'), // Active participant
      v.literal('completed'), // Finished program (graduated)
      v.literal('withdrawn'), // Left program
      v.literal('removed'), // Removed by admin
    ),

    // Tracking
    enrolledAt: v.number(),
    completedAt: v.optional(v.number()),

    // Manual attendance tracking (for non-event activities)
    manualAttendanceCount: v.optional(v.number()),
    attendanceNotes: v.optional(v.string()),

    // Admin notes
    adminNotes: v.optional(v.string()),

    // Enrollment request (if approval_required)
    requestedAt: v.optional(v.number()),
    approvedBy: v.optional(v.id('orgMemberships')),
    approvedAt: v.optional(v.number()),
  })
    .index('by_program', ['programId'])
    .index('by_user', ['userId'])
    .index('by_org', ['orgId'])
    .index('by_program_status', ['programId', 'status'])
    .index('by_user_org', ['userId', 'orgId']),

  // Guest profiles (Phase 33) - lightweight accounts for visitors
  guestProfiles: defineTable({
    userId: v.string(),
    name: v.string(),
    email: v.string(),

    // Optional contact info
    phone: v.optional(v.string()),
    organization: v.optional(v.string()),
    title: v.optional(v.string()),

    // Visit tracking
    visitCount: v.number(),
    firstVisitDate: v.optional(v.string()), // ISO date
    lastVisitDate: v.optional(v.string()), // ISO date

    // Conversion tracking (GUEST-08)
    becameMember: v.boolean(),
    becameMemberAt: v.optional(v.number()),
    convertedToProfileId: v.optional(v.id('profiles')),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_email', ['email']),

  // Visit application responses (Phase 33) - custom form field answers
  visitApplicationResponses: defineTable({
    spaceBookingId: v.id('spaceBookings'),
    fieldId: v.string(),
    value: v.string(),
    createdAt: v.number(),
  }).index('by_booking', ['spaceBookingId']),

  // Anonymous feedback submissions
  feedback: defineTable({
    featureRequests: v.optional(v.string()),
    bugReports: v.optional(v.string()),
    page: v.string(),
    createdAt: v.number(),
  }).index('by_created', ['createdAt']),
})
