import { Link, createFileRoute } from '@tanstack/react-router'
import { AuthHeader } from '~/components/layout/auth-header'
import { GradientBg } from '~/components/layout/GradientBg'

export const Route = createFileRoute('/terms')({
  component: TermsPage,
})

function TermsPage() {
  return (
    <GradientBg variant="subtle">
      <AuthHeader />
      <main className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-display font-semibold text-foreground mb-2">
          Terms of Use
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Last updated: February 22, 2026
        </p>

        <div className="space-y-8 text-sm leading-relaxed text-foreground/90">
          <Section title="1. Service Description">
            <p>
              AI Safety Talent Network ("ASTN") is a free career platform that
              helps AI safety professionals build profiles, discover
              opportunities, and receive AI-powered career guidance. ASTN is
              provided as-is for informational and career exploration purposes.
            </p>
          </Section>

          <Section title="2. Eligibility">
            <p>
              You must be at least 16 years old to use ASTN. By creating an
              account, you represent that you meet this requirement.
            </p>
          </Section>

          <Section title="3. Account Responsibilities">
            <p>
              You are responsible for maintaining the security of your account
              and the accuracy of the information you provide. You agree to
              provide truthful information in your profile.
            </p>
          </Section>

          <Section title="4. User Conduct">
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-1">
              <li>Provide false or misleading information in your profile.</li>
              <li>
                Use the platform for purposes unrelated to career development in
                AI safety.
              </li>
              <li>
                Attempt to access other users' data or circumvent security
                measures.
              </li>
              <li>
                Scrape, crawl, or otherwise extract data from the platform.
              </li>
              <li>Use the platform in violation of applicable laws.</li>
            </ul>
          </Section>

          <Section title="5. AI-Generated Content">
            <p>
              ASTN uses AI to generate profile enrichments, match explanations,
              career actions, and recommendations. This content is{' '}
              <strong>informational only</strong> and does not constitute
              professional career advice, legal advice, or employment
              guarantees. Match tiers and recommendations are estimates and
              should be used as one input in your career decisions.
            </p>
          </Section>

          <Section title="6. Intellectual Property">
            <p>
              You retain ownership of the content you provide (profile data,
              resumes, messages). By using ASTN, you grant us a limited license
              to process your content as necessary to provide the service.
              AI-generated content (match explanations, career actions) is
              provided for your personal use within the platform.
            </p>
          </Section>

          <Section title="7. Limitation of Liability">
            <p>
              ASTN is provided "as is" without warranties of any kind. We are
              not liable for:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-1">
              <li>
                Accuracy of AI-generated content, matches, or recommendations.
              </li>
              <li>
                Employment outcomes or career decisions based on the platform.
              </li>
              <li>Service interruptions, data loss, or errors.</li>
              <li>
                Actions of third-party services (Clerk, Convex, Anthropic).
              </li>
            </ul>
            <p className="mt-2">
              To the maximum extent permitted by law, ASTN's total liability is
              limited to the amount you paid to use the service (currently $0).
            </p>
          </Section>

          <Section title="8. Modifications">
            <p>
              We may update these terms at any time. Material changes will be
              communicated via the platform. Continued use after changes
              constitutes acceptance of the updated terms.
            </p>
          </Section>

          <Section title="9. Termination">
            <p>
              You may delete your account at any time via Settings, which
              permanently removes your data. We may terminate or suspend
              accounts that violate these terms or engage in abusive behavior.
            </p>
          </Section>

          <Section title="10. Governing Law">
            <p>
              These terms are governed by the laws of Argentina, without regard
              to conflict of law principles. Disputes shall be resolved in the
              courts of the City of Buenos Aires, Argentina.
            </p>
          </Section>

          <Section title="11. Contact">
            <p>
              For questions about these terms:{' '}
              <a
                href="mailto:legal@astn.org"
                className="text-primary hover:underline"
              >
                legal@astn.org
              </a>
            </p>
          </Section>
        </div>

        <footer className="mt-12 pt-6 border-t text-sm text-muted-foreground">
          <Link to="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
        </footer>
      </main>
    </GradientBg>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section>
      <h2 className="text-base font-semibold text-foreground mb-2">{title}</h2>
      {children}
    </section>
  )
}
