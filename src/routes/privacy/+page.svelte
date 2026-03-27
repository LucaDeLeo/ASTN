<script lang="ts">
  import GradientBg from '~/components/layout/GradientBg.svelte'
  import PublicHeader from '~/components/layout/public-header.svelte'
</script>

<GradientBg variant="subtle">
  <PublicHeader />
  <main class="container mx-auto max-w-3xl px-4 py-12">
    <h1 class="mb-2 text-3xl font-display font-semibold text-foreground">
      Privacy Policy
    </h1>
    <p class="mb-8 text-sm text-muted-foreground">
      Last updated: February 22, 2026
    </p>

    <div class="space-y-8 text-sm leading-relaxed text-foreground/90">
      <section>
        <h2 class="mb-2 text-base font-semibold text-foreground">1. Data Controller</h2>
        <p>
          AI Safety Talent Network ("ASTN", "we", "us") operates this platform.
          For questions about your data, contact us at
          <a href="mailto:privacy@astn.org" class="text-primary hover:underline">
            privacy@astn.org
          </a>.
        </p>
      </section>

      <section>
        <h2 class="mb-2 text-base font-semibold text-foreground">2. Data We Collect</h2>
        <ul class="list-disc space-y-1 pl-5">
          <li>
            <strong>Profile information:</strong> name, location, education,
            work history, skills, career goals, and preferences you provide.
          </li>
          <li>
            <strong>Authentication data:</strong> email address and account
            identifiers from your sign-in provider (Google, GitHub, or email).
          </li>
          <li>
            <strong>Uploaded documents:</strong> resumes or CVs you upload for
            data extraction.
          </li>
          <li>
            <strong>AI conversation logs:</strong> messages exchanged with our
            AI assistant for profile enrichment and career guidance.
          </li>
          <li>
            <strong>Usage data:</strong> interaction patterns with matching
            results, career actions, and platform features.
          </li>
        </ul>
      </section>

      <section>
        <h2 class="mb-2 text-base font-semibold text-foreground">3. How We Process Your Data</h2>
        <ul class="list-disc space-y-1 pl-5">
          <li>
            <strong>AI profile building:</strong> conversational AI analyzes
            your inputs to structure and enrich your career profile.
          </li>
          <li>
            <strong>Opportunity matching:</strong> your profile is compared
            against active opportunities to generate tier-based match results.
          </li>
          <li>
            <strong>Career actions:</strong> personalized career steps are
            generated based on your profile and goals.
          </li>
          <li>
            <strong>Document extraction:</strong> uploaded resumes are processed
            by AI to extract structured career data.
          </li>
        </ul>
        <p class="mt-2">
          Legal basis (GDPR): consent for AI processing, legitimate interest for
          core platform functionality.
        </p>
      </section>

      <section>
        <h2 class="mb-2 text-base font-semibold text-foreground">4. AI Processing Disclosure</h2>
        <p>
          We use Anthropic's Claude API to power AI features. Your data is sent
          to Anthropic's servers for processing. Per Anthropic's commercial
          terms, data sent via the API is
          <strong> not used to train their models</strong> and is subject to a
          zero-retention policy (not stored beyond the duration of the API
          call).
        </p>
      </section>

      <section>
        <h2 class="mb-2 text-base font-semibold text-foreground">5. Third-Party Services</h2>
        <ul class="list-disc space-y-1 pl-5">
          <li><strong>Convex</strong> - database and backend infrastructure (US-based).</li>
          <li><strong>Clerk</strong> - authentication and identity management.</li>
          <li><strong>Anthropic</strong> - AI processing via the Claude API.</li>
        </ul>
        <p class="mt-2">
          We do not sell, rent, or share your personal data with advertisers or
          data brokers.
        </p>
      </section>

      <section>
        <h2 class="mb-2 text-base font-semibold text-foreground">6. Data Retention</h2>
        <p>
          Your data is retained for as long as your account is active. You can
          delete your account and all associated data at any time via Settings.
          Upon deletion, your data is permanently removed from our systems.
        </p>
      </section>

      <section>
        <h2 class="mb-2 text-base font-semibold text-foreground">7. Your Rights</h2>
        <p>You have the right to:</p>
        <ul class="mt-1 list-disc space-y-1 pl-5">
          <li><strong>Access</strong> your personal data.</li>
          <li><strong>Rectify</strong> inaccurate data via your profile.</li>
          <li><strong>Erase</strong> your data by deleting your account.</li>
          <li><strong>Port</strong> your data (contact us for an export).</li>
          <li><strong>Restrict</strong> processing in certain circumstances.</li>
          <li>
            <strong>Withdraw consent</strong> for AI processing at any time by
            deleting your account.
          </li>
        </ul>
        <p class="mt-2">
          To exercise these rights, contact
          <a href="mailto:privacy@astn.org" class="text-primary hover:underline">
            privacy@astn.org
          </a>.
        </p>
      </section>

      <section>
        <h2 class="mb-2 text-base font-semibold text-foreground">8. International Transfers</h2>
        <p>
          Your data is stored on servers in the United States via Convex. If
          you are located outside the US, your data is transferred
          internationally. We rely on standard contractual clauses and service
          provider agreements to ensure adequate protection.
        </p>
      </section>

      <section>
        <h2 class="mb-2 text-base font-semibold text-foreground">9. Argentine Law (Ley 25.326)</h2>
        <p>
          If you are located in Argentina, you have rights under the Personal
          Data Protection Law (Ley 25.326), including the right to access,
          rectify, and delete your personal data. The AAIP (Agencia de Acceso a
          la Informacion Publica) is the supervisory authority.
        </p>
      </section>

      <section>
        <h2 class="mb-2 text-base font-semibold text-foreground">10. GDPR (EU/EEA Users)</h2>
        <p>
          If you are located in the EU/EEA, the General Data Protection
          Regulation applies. Our legal bases are consent (for AI processing)
          and legitimate interest (for platform functionality). You may lodge a
          complaint with your local data protection authority.
        </p>
      </section>

      <section>
        <h2 class="mb-2 text-base font-semibold text-foreground">11. Children</h2>
        <p>
          ASTN is not intended for users under 16 years of age. We do not
          knowingly collect data from children.
        </p>
      </section>

      <section>
        <h2 class="mb-2 text-base font-semibold text-foreground">12. Policy Changes</h2>
        <p>
          We may update this policy. If we make material changes that affect how
          your data is processed, we will request renewed consent before
          continuing AI processing.
        </p>
      </section>

      <section>
        <h2 class="mb-2 text-base font-semibold text-foreground">13. Contact</h2>
        <p>
          For privacy inquiries:
          <a href="mailto:privacy@astn.org" class="text-primary hover:underline">
            privacy@astn.org
          </a>
        </p>
      </section>
    </div>

    <footer class="mt-12 border-t pt-6 text-sm text-muted-foreground">
      <a href="/terms" class="text-primary hover:underline">Terms of Use</a>
    </footer>
  </main>
</GradientBg>
