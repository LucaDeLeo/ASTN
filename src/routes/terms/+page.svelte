<script lang="ts">
  import GradientBg from '~/components/layout/GradientBg.svelte'
  import PublicHeader from '~/components/layout/public-header.svelte'
</script>

<GradientBg variant="subtle">
  <PublicHeader />
  <main class="container mx-auto max-w-3xl px-4 py-12">
    <h1 class="mb-2 text-3xl font-display font-semibold text-foreground">
      Terms of Use
    </h1>
    <p class="mb-8 text-sm text-muted-foreground">
      Last updated: February 22, 2026
    </p>

    <div class="space-y-8 text-sm leading-relaxed text-foreground/90">
      <section>
        <h2 class="mb-2 text-base font-semibold text-foreground">1. Service Description</h2>
        <p>
          AI Safety Talent Network ("ASTN") is a free career platform that
          helps AI safety professionals build profiles, discover opportunities,
          and receive AI-powered career guidance. ASTN is provided as-is for
          informational and career exploration purposes.
        </p>
      </section>

      <section>
        <h2 class="mb-2 text-base font-semibold text-foreground">2. Eligibility</h2>
        <p>
          You must be at least 16 years old to use ASTN. By creating an
          account, you represent that you meet this requirement.
        </p>
      </section>

      <section>
        <h2 class="mb-2 text-base font-semibold text-foreground">3. Account Responsibilities</h2>
        <p>
          You are responsible for maintaining the security of your account and
          the accuracy of the information you provide. You agree to provide
          truthful information in your profile.
        </p>
      </section>

      <section>
        <h2 class="mb-2 text-base font-semibold text-foreground">4. User Conduct</h2>
        <p>You agree not to:</p>
        <ul class="mt-1 list-disc space-y-1 pl-5">
          <li>Provide false or misleading information in your profile.</li>
          <li>
            Use the platform for purposes unrelated to career development in AI
            safety.
          </li>
          <li>
            Attempt to access other users' data or circumvent security
            measures.
          </li>
          <li>Scrape, crawl, or otherwise extract data from the platform.</li>
          <li>Use the platform in violation of applicable laws.</li>
        </ul>
      </section>

      <section>
        <h2 class="mb-2 text-base font-semibold text-foreground">5. AI-Generated Content</h2>
        <p>
          ASTN uses AI to generate profile enrichments, match explanations,
          career actions, and recommendations. This content is
          <strong> informational only</strong> and does not constitute
          professional career advice, legal advice, or employment guarantees.
          Match tiers and recommendations are estimates and should be used as
          one input in your career decisions.
        </p>
      </section>

      <section>
        <h2 class="mb-2 text-base font-semibold text-foreground">6. Intellectual Property</h2>
        <p>
          You retain ownership of the content you provide (profile data,
          resumes, messages). By using ASTN, you grant us a limited license to
          process your content as necessary to provide the service. AI-generated
          content (match explanations, career actions) is provided for your
          personal use within the platform.
        </p>
      </section>

      <section>
        <h2 class="mb-2 text-base font-semibold text-foreground">7. Limitation of Liability</h2>
        <p>
          ASTN is provided "as is" without warranties of any kind. We are not
          liable for:
        </p>
        <ul class="mt-1 list-disc space-y-1 pl-5">
          <li>Accuracy of AI-generated content, matches, or recommendations.</li>
          <li>Employment outcomes or career decisions based on the platform.</li>
          <li>Service interruptions, data loss, or errors.</li>
          <li>Actions of third-party services (Clerk, Convex, Anthropic).</li>
        </ul>
        <p class="mt-2">
          To the maximum extent permitted by law, ASTN's total liability is
          limited to the amount you paid to use the service (currently $0).
        </p>
      </section>

      <section>
        <h2 class="mb-2 text-base font-semibold text-foreground">8. Modifications</h2>
        <p>
          We may update these terms at any time. Material changes will be
          communicated via the platform. Continued use after changes constitutes
          acceptance of the updated terms.
        </p>
      </section>

      <section>
        <h2 class="mb-2 text-base font-semibold text-foreground">9. Termination</h2>
        <p>
          You may delete your account at any time via Settings, which
          permanently removes your data. We may terminate or suspend accounts
          that violate these terms or engage in abusive behavior.
        </p>
      </section>

      <section>
        <h2 class="mb-2 text-base font-semibold text-foreground">10. Governing Law</h2>
        <p>
          These terms are governed by the laws of Argentina, without regard to
          conflict of law principles. Disputes shall be resolved in the courts
          of the City of Buenos Aires, Argentina.
        </p>
      </section>

      <section>
        <h2 class="mb-2 text-base font-semibold text-foreground">11. Contact</h2>
        <p>
          For questions about these terms:
          <a href="mailto:legal@astn.org" class="text-primary hover:underline">
            legal@astn.org
          </a>
        </p>
      </section>
    </div>

    <footer class="mt-12 border-t pt-6 text-sm text-muted-foreground">
      <a href="/privacy" class="text-primary hover:underline">Privacy Policy</a>
    </footer>
  </main>
</GradientBg>
