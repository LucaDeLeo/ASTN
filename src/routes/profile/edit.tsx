import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { AuthLoading, Authenticated, Unauthenticated } from "convex/react";
import { AuthHeader } from "~/components/layout/auth-header";
import { ProfileWizard } from "~/components/profile/wizard/ProfileWizard";
import { Spinner } from "~/components/ui/spinner";

const stepSchema = z.enum([
  "basic",
  "education",
  "work",
  "goals",
  "skills",
  "enrichment",
  "privacy",
]);

const searchSchema = z.object({
  step: stepSchema.optional().default("basic"),
  fromExtraction: z.string().optional(),
});

export const Route = createFileRoute("/profile/edit")({
  validateSearch: searchSchema,
  component: ProfileEditPage,
});

function ProfileEditPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <AuthHeader />
      <AuthLoading>
        <div className="flex items-center justify-center min-h-[calc(100vh-65px)]">
          <Spinner />
        </div>
      </AuthLoading>
      <Unauthenticated>
        <UnauthenticatedRedirect />
      </Unauthenticated>
      <Authenticated>
        <AuthenticatedContent />
      </Authenticated>
    </div>
  );
}

function UnauthenticatedRedirect() {
  const navigate = useNavigate();
  navigate({ to: "/login" });
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-65px)]">
      <Spinner />
    </div>
  );
}

function AuthenticatedContent() {
  const { step, fromExtraction } = Route.useSearch();
  const navigate = useNavigate();

  const handleStepChange = (newStep: z.infer<typeof stepSchema>) => {
    // Clear fromExtraction when navigating away
    navigate({ to: "/profile/edit", search: { step: newStep } });
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Edit Profile</h1>
        <p className="text-slate-500 mt-1">
          Complete your profile to unlock smart matching and connect with
          opportunities
        </p>
      </div>

      <ProfileWizard
        currentStep={step}
        onStepChange={handleStepChange}
        fromExtraction={fromExtraction === "true"}
      />
    </main>
  );
}
