'use node'

import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components'
import { render } from '@react-email/render'
import { format } from 'date-fns'

// ASTN brand color (coral accent)
const CORAL = '#FF6B4A'

// ===== Match Alert Email =====

interface MatchAlertProps {
  userName: string
  matches: Array<{
    title: string
    org: string
    tier: string
    explanation: string
    recommendations: Array<string>
  }>
}

export function MatchAlertEmail({ userName, matches }: MatchAlertProps) {
  const displayMatches = matches.slice(0, 5)
  const hasMore = matches.length > 5

  return (
    <Html>
      <Head />
      <Preview>
        {`${matches.length} new great-fit ${matches.length === 1 ? 'opportunity' : 'opportunities'} found for you on ASTN`}
      </Preview>
      <Tailwind>
        <Body className="bg-gray-100 font-sans">
          <Container className="bg-white mx-auto my-8 p-8 rounded-lg max-w-xl">
            {/* Header with Logo */}
            <Section>
              <Img
                src="https://astn.ai/logo.png"
                width="120"
                height="40"
                alt="ASTN"
                className="mx-auto mb-4"
              />
            </Section>

            {/* Greeting */}
            <Text className="text-xl font-semibold text-gray-900 mb-2">
              Hi {userName},
            </Text>
            <Text className="text-gray-600 mb-6">
              We found {matches.length} new great-fit{' '}
              {matches.length === 1 ? 'opportunity' : 'opportunities'} that
              match your profile and goals:
            </Text>

            {/* Match Cards */}
            {displayMatches.map((match, index) => (
              <Section
                key={index}
                className="mb-4 p-4 border-l-4 rounded-r-lg bg-gray-50"
                style={{ borderLeftColor: CORAL }}
              >
                <Text className="font-bold text-gray-900 mb-1 text-base">
                  {match.title}
                </Text>
                <Text className="text-gray-600 text-sm mb-2">{match.org}</Text>
                <Text className="text-gray-700 text-sm mb-3">
                  {match.explanation}
                </Text>
                {match.recommendations.length > 0 && (
                  <Section className="bg-white p-3 rounded border border-gray-200">
                    <Text className="text-xs font-semibold text-gray-500 uppercase mb-1">
                      What to do next
                    </Text>
                    {match.recommendations.map((rec, recIndex) => (
                      <Text
                        key={recIndex}
                        className="text-sm text-gray-700 mb-1"
                      >
                        - {rec}
                      </Text>
                    ))}
                  </Section>
                )}
              </Section>
            ))}

            {hasMore && (
              <Text className="text-sm text-gray-500 text-center mb-6">
                + {matches.length - 5} more matches
              </Text>
            )}

            <Hr className="my-6 border-gray-200" />

            {/* CTA Button */}
            <Section className="text-center">
              <Button
                href="https://astn.ai/matches"
                className="px-6 py-3 text-white font-semibold rounded-lg"
                style={{ backgroundColor: CORAL }}
              >
                View All Matches
              </Button>
            </Section>

            <Hr className="my-6 border-gray-200" />

            {/* Footer */}
            <Text className="text-xs text-gray-400 text-center">
              AI Safety Talent Network - Connecting talent with AI safety
              opportunities
            </Text>
            <Text className="text-xs text-gray-400 text-center">
              <a href="https://astn.ai/settings" className="text-gray-400">
                Manage notification preferences
              </a>
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

// ===== Weekly Digest Email =====

interface WeeklyDigestProps {
  userName: string
  newMatchesCount: number
  topOpportunities: Array<{
    title: string
    org: string
    tier: string
  }>
  profileNudges: Array<string>
}

export function WeeklyDigestEmail({
  userName,
  newMatchesCount,
  topOpportunities,
  profileNudges,
}: WeeklyDigestProps) {
  return (
    <Html>
      <Head />
      <Preview>Your weekly AI safety opportunities digest from ASTN</Preview>
      <Tailwind>
        <Body className="bg-gray-100 font-sans">
          <Container className="bg-white mx-auto my-8 p-8 rounded-lg max-w-xl">
            {/* Header with Logo */}
            <Section>
              <Img
                src="https://astn.ai/logo.png"
                width="120"
                height="40"
                alt="ASTN"
                className="mx-auto mb-4"
              />
            </Section>

            {/* Greeting */}
            <Text className="text-xl font-semibold text-gray-900 mb-2">
              Hi {userName},
            </Text>
            <Text className="text-gray-600 mb-6">
              Here&apos;s your weekly summary of AI safety opportunities and
              profile insights.
            </Text>

            {/* New Matches Section */}
            <Section className="mb-6">
              <Text
                className="text-lg font-semibold mb-3"
                style={{ color: CORAL }}
              >
                New Matches This Week
              </Text>
              {newMatchesCount > 0 ? (
                <>
                  <Text className="text-gray-700 mb-3">
                    You have {newMatchesCount} new{' '}
                    {newMatchesCount === 1 ? 'match' : 'matches'} waiting for
                    you!
                  </Text>
                  {topOpportunities.length > 0 && (
                    <Section className="bg-gray-50 p-4 rounded-lg mb-4">
                      {topOpportunities.slice(0, 3).map((opp, index) => (
                        <Section
                          key={index}
                          className="mb-2 pb-2 border-b border-gray-200 last:border-0 last:mb-0 last:pb-0"
                        >
                          <Text className="font-medium text-gray-900 text-sm mb-0">
                            {opp.title}
                          </Text>
                          <Text className="text-gray-500 text-xs">
                            {opp.org} - {opp.tier} match
                          </Text>
                        </Section>
                      ))}
                    </Section>
                  )}
                </>
              ) : (
                <Text className="text-gray-500 italic">
                  No new matches this week, but keep your profile updated for
                  the best results!
                </Text>
              )}
            </Section>

            {/* Profile Improvement Suggestions */}
            {profileNudges.length > 0 && (
              <Section className="mb-6">
                <Text
                  className="text-lg font-semibold mb-3"
                  style={{ color: CORAL }}
                >
                  Profile Improvement Tips
                </Text>
                <Section className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  {profileNudges.map((nudge, index) => (
                    <Text key={index} className="text-sm text-amber-800 mb-2">
                      - {nudge}
                    </Text>
                  ))}
                </Section>
              </Section>
            )}

            <Hr className="my-6 border-gray-200" />

            {/* CTA Buttons */}
            <Section className="text-center">
              <Button
                href="https://astn.ai/matches"
                className="px-6 py-3 text-white font-semibold rounded-lg mr-2"
                style={{ backgroundColor: CORAL }}
              >
                View Matches
              </Button>
              <Button
                href="https://astn.ai/profile/edit"
                className="px-6 py-3 text-gray-700 font-semibold rounded-lg border border-gray-300 bg-white ml-2"
              >
                Update Profile
              </Button>
            </Section>

            <Hr className="my-6 border-gray-200" />

            {/* Footer */}
            <Text className="text-xs text-gray-400 text-center">
              AI Safety Talent Network - Connecting talent with AI safety
              opportunities
            </Text>
            <Text className="text-xs text-gray-400 text-center">
              <a href="https://astn.ai/settings" className="text-gray-400">
                Manage notification preferences
              </a>
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

// ===== Render Functions =====

export async function renderMatchAlert(
  props: MatchAlertProps,
): Promise<string> {
  return await render(<MatchAlertEmail {...props} />)
}

export async function renderWeeklyDigest(
  props: WeeklyDigestProps,
): Promise<string> {
  return await render(<WeeklyDigestEmail {...props} />)
}

// ===== Event Digest Email =====

interface EventDigestProps {
  userName: string
  frequency: 'daily' | 'weekly'
  events: Array<{
    title: string
    orgName: string
    startAt: number
    location?: string
    isVirtual: boolean
    url: string
    description?: string
  }>
}

export function EventDigestEmail({
  userName,
  frequency,
  events,
}: EventDigestProps) {
  // Group events by org using Map to avoid lint issues with Record indexing
  const eventsByOrgMap = new Map<string, typeof events>()
  for (const event of events) {
    const existing = eventsByOrgMap.get(event.orgName)
    if (existing) {
      existing.push(event)
    } else {
      eventsByOrgMap.set(event.orgName, [event])
    }
  }
  const eventsByOrg = Object.fromEntries(eventsByOrgMap.entries())

  const introText =
    frequency === 'daily'
      ? 'Here are upcoming events from your organizations:'
      : "Here's your weekly event roundup:"

  return (
    <Html>
      <Head />
      <Preview>
        {frequency === 'daily'
          ? `${events.length} upcoming events from your organizations`
          : `Your weekly event roundup - ${events.length} upcoming events`}
      </Preview>
      <Tailwind>
        <Body className="bg-gray-100 font-sans">
          <Container className="bg-white mx-auto my-8 p-8 rounded-lg max-w-xl">
            {/* Header with Logo */}
            <Section>
              <Img
                src="https://astn.ai/logo.png"
                width="120"
                height="40"
                alt="ASTN"
                className="mx-auto mb-4"
              />
            </Section>

            {/* Greeting */}
            <Text className="text-xl font-semibold text-gray-900 mb-2">
              Hi {userName},
            </Text>
            <Text className="text-gray-600 mb-6">{introText}</Text>

            {/* Events grouped by org */}
            {Object.entries(eventsByOrg).map(([orgName, orgEvents]) => {
              const displayEvents = orgEvents.slice(0, 5)
              const hasMore = orgEvents.length > 5

              return (
                <Section key={orgName} className="mb-6">
                  <Text
                    className="text-lg font-semibold mb-3"
                    style={{ color: CORAL }}
                  >
                    {orgName}
                  </Text>
                  {displayEvents.map((event, index) => (
                    <Section
                      key={index}
                      className="mb-3 p-4 border-l-4 rounded-r-lg bg-gray-50"
                      style={{ borderLeftColor: CORAL }}
                    >
                      <Text className="font-medium text-gray-900 mb-1">
                        {event.title}
                      </Text>
                      <Text className="text-gray-600 text-sm mb-1">
                        {format(
                          new Date(event.startAt),
                          "EEE, MMM d 'at' h:mm a",
                        )}
                      </Text>
                      <Text className="text-gray-500 text-sm mb-2">
                        {event.isVirtual ? 'Online' : event.location || 'TBD'}
                      </Text>
                      {event.description && (
                        <Text className="text-gray-600 text-sm mb-3">
                          {event.description.slice(0, 100)}
                          {event.description.length > 100 ? '...' : ''}
                        </Text>
                      )}
                      <Button
                        href={event.url}
                        className="px-4 py-2 text-white text-sm font-medium rounded"
                        style={{ backgroundColor: CORAL }}
                      >
                        View event & RSVP on lu.ma
                      </Button>
                    </Section>
                  ))}
                  {hasMore && (
                    <Text className="text-sm text-gray-500">
                      + {orgEvents.length - 5} more events from {orgName}
                    </Text>
                  )}
                </Section>
              )
            })}

            <Hr className="my-6 border-gray-200" />

            {/* Footer */}
            <Text className="text-xs text-gray-400 text-center">
              AI Safety Talent Network - Connecting talent with AI safety
              opportunities
            </Text>
            <Text className="text-xs text-gray-400 text-center">
              <a href="https://astn.ai/settings" className="text-gray-400">
                Manage notification preferences
              </a>
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export async function renderEventDigest(
  props: EventDigestProps,
): Promise<string> {
  return await render(<EventDigestEmail {...props} />)
}
