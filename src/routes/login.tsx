import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { useEffect } from "react";
import { LoginCard } from "~/components/auth/login-card";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  return (
    <main
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        // Subtle gradient: warm gray -> coral tint at edges per CONTEXT.md
        background: `
          radial-gradient(
            ellipse at center,
            oklch(0.98 0 0) 0%,
            oklch(0.96 0.02 30) 70%,
            oklch(0.94 0.04 30) 100%
          )
        `,
        // Very subtle noise grain texture (2-3% opacity) for warmth
        backgroundImage: `
          radial-gradient(
            ellipse at center,
            oklch(0.98 0 0) 0%,
            oklch(0.96 0.02 30) 70%,
            oklch(0.94 0.04 30) 100%
          ),
          url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")
        `,
      }}
    >
      <AuthLoading>
        <LoginCard isLoading />
      </AuthLoading>
      <Unauthenticated>
        <LoginCard />
      </Unauthenticated>
      <Authenticated>
        <AuthenticatedRedirect />
      </Authenticated>
    </main>
  );
}

function AuthenticatedRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect authenticated users to home
    navigate({ to: "/" });
  }, [navigate]);

  // Show loading state while redirecting
  return <LoginCard isLoading />;
}
