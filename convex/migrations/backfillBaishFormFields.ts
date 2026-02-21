import { v } from 'convex/values'
import { internalMutation } from '../_generated/server'
import type { FormField } from '../lib/formFields'

/**
 * One-time migration: Backfill the BAISH "Technical AI Safety" opportunity
 * with formFields matching the previously hardcoded application form.
 *
 * Run via Convex dashboard:
 *   npx convex run migrations/backfillBaishFormFields:backfill
 *
 * Keys match the existing application response data exactly so existing
 * applications remain compatible.
 */

const BAISH_FORM_FIELDS: Array<FormField> = [
  // Section: Course Details
  {
    key: '_courseDetails',
    kind: 'section_header',
    label: 'Course Details',
    description:
      'Understand current safety techniques. Map the gaps. Identify where you can contribute. All in 30 hours.',
  },
  {
    key: 'applyingAs',
    kind: 'multi_select',
    label: 'Are you applying as a participant or facilitator?',
    options: ['Participant', 'Facilitator'],
    required: false,
    maxSelections: 2,
  },
  {
    key: 'roundPreference',
    kind: 'select',
    label: 'Which round do you prefer?',
    options: ['Intensive (6-day)'],
    required: false,
  },
  {
    key: 'openToAlternativePlacement',
    kind: 'checkbox',
    label: 'Alternative course placement',
    description:
      'Are you open to being placed on a different course if we think it would be a better fit?',
  },

  // Section: Personal Information
  {
    key: '_personalInfo',
    kind: 'section_header',
    label: 'Personal Information',
  },
  {
    key: 'firstName',
    kind: 'text',
    label: 'First name',
    required: true,
  },
  {
    key: 'lastName',
    kind: 'text',
    label: 'Last name',
    required: true,
  },
  {
    key: 'email',
    kind: 'email',
    label: 'Email address',
    required: true,
  },
  {
    key: 'profileUrl',
    kind: 'url',
    label: 'Profile URL',
    required: true,
    description:
      'Provide a link for your LinkedIn profile or your CV. We prefer LinkedIn.',
    placeholder: 'https://linkedin.com/in/...',
  },
  {
    key: 'otherProfileLink',
    kind: 'url',
    label: 'Link to any other profile',
    description: 'E.g. your CV, GitHub, personal website, blog.',
    placeholder: 'https://...',
  },
  {
    key: 'fieldsOfStudy',
    kind: 'multi_select',
    label: 'What is the closest match to your field(s) of study?',
    required: true,
    description: 'Select up to three, including past or present studies.',
    options: [
      'Computer Science',
      'Machine Learning / AI',
      'Mathematics',
      'Statistics',
      'Physics',
      'Philosophy',
      'Cognitive Science',
      'Neuroscience',
      'Economics',
      'Political Science',
      'Law',
      'Biology',
      'Engineering',
      'Psychology',
      'Other',
    ],
    maxSelections: 3,
  },
  {
    key: 'careerStage',
    kind: 'select',
    label: 'What is your current career stage?',
    required: true,
    options: [
      'Undergraduate student',
      'Masters student',
      'PhD student',
      'Postdoc / Early career researcher',
      'Mid-career professional',
      'Senior professional',
      'Career changer',
      'Other',
    ],
  },
  {
    key: 'location',
    kind: 'text',
    label: 'Where will you be based during this course?',
    required: true,
    placeholder: 'City, Country',
  },

  // Section: Essays
  {
    key: '_essays',
    kind: 'section_header',
    label: 'Essays',
  },
  {
    key: 'howCourseHelps',
    kind: 'textarea',
    label:
      'How do you expect this course will help you contribute to making AI go well?',
    required: true,
    description:
      "We suggest 3-7 bullet points. Tell us your game plan: What steps will you take post-course? How does this course unlock those moves? What's your theory of change for AI safety?",
    rows: 6,
  },
  {
    key: 'aiSafetyEngagement',
    kind: 'textarea',
    label: 'How have you engaged with the AI safety field so far?',
    required: true,
    description:
      "Show us you're not starting from zero. This could include projects, blog posts, resources you've read, or events you've attended or organised.",
    rows: 6,
  },
  {
    key: 'relevantSkills',
    kind: 'textarea',
    label:
      'What skills have you developed that could be used to make AI go well?',
    required: true,
    description:
      'Technical and non-technical skills both matter. This could be policy/governance experience, technical background, research skills, or communications experience.',
    rows: 6,
  },
  {
    key: 'proudestAchievement',
    kind: 'textarea',
    label: "Tell us about one achievement you're most proud of",
    required: true,
    description:
      "We're looking for builders, not just thinkers. That one project you pulled off, the system you changed, the community you built, or the challenge everyone said couldn't be solved. This is your chance to brag!",
    rows: 5,
  },

  // Section: Referral & Consents
  {
    key: '_referralConsents',
    kind: 'section_header',
    label: 'Referral & Consents',
  },
  {
    key: 'howHeardAbout',
    kind: 'text',
    label: 'Where did you hear about this course?',
  },
  {
    key: 'nomineeEmail',
    kind: 'email',
    label:
      'Know someone exceptional who should take this course? Share their email below.',
    description:
      "You can nominate more than one person. If we think they're a good fit, we may reach out to them.",
    placeholder: 'someone@example.com',
  },
  {
    key: 'canMentionName',
    kind: 'radio',
    label: 'Can we mention your name if we reach out to them?',
    options: ['Yes', 'No'],
  },
  {
    key: 'applicationFeedback',
    kind: 'textarea',
    label: 'Do you have any feedback on this application form?',
    rows: 2,
  },
  {
    key: 'dataShareConsent',
    kind: 'checkbox',
    label: 'Can we share your data with third-party AI safety organisations?',
    description:
      'If you opt-in, we may share parts of your application with organisations we trust. They may email you with jobs or other opportunities. This will not affect your application decision. You can opt-out at any time.',
  },
  {
    key: 'diversityDataConsent',
    kind: 'checkbox',
    label: 'Diversity data consent',
    description:
      "We value diverse contributions towards making AI safe. If you opt-in, we'll collect information for diversity, equality and inclusion monitoring. We won't share your specific data outside BlueDot Impact.",
  },
]

export const backfill = internalMutation({
  args: { opportunityId: v.optional(v.id('orgOpportunities')) },
  returns: v.string(),
  handler: async (ctx, { opportunityId }) => {
    let opp
    if (opportunityId) {
      opp = await ctx.db.get('orgOpportunities', opportunityId)
    } else {
      // Find the BAISH featured opportunity
      const baishOrg = await ctx.db
        .query('organizations')
        .withIndex('by_slug', (q) => q.eq('slug', 'baish'))
        .first()
      if (!baishOrg) return 'BAISH org not found'

      opp = await ctx.db
        .query('orgOpportunities')
        .withIndex('by_org_and_featured', (q) =>
          q.eq('orgId', baishOrg._id).eq('featured', true),
        )
        .first()
    }

    if (!opp) return 'Opportunity not found'

    if (opp.formFields) {
      return `Opportunity "${opp.title}" already has formFields (${(opp.formFields as Array<unknown>).length} fields) — skipping`
    }

    await ctx.db.patch('orgOpportunities', opp._id, {
      formFields: BAISH_FORM_FIELDS,
    })

    return `Backfilled "${opp.title}" with ${BAISH_FORM_FIELDS.length} form fields`
  },
})
