import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { AuthLoading, Authenticated, Unauthenticated } from "convex/react";
import { AuthHeader } from "~/components/layout/auth-header";
import { Spinner } from "~/components/ui/spinner";

export const Route = createFileRoute("/settings")({
  component: SettingsLayout,
});

function SettingsLayout() {
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
        <Outlet />
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
