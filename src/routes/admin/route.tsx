import { Link, Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { AuthLoading, Authenticated, Unauthenticated } from "convex/react";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { useDotGridStyle } from "~/hooks/use-dot-grid-style";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <>
      <AuthLoading>
        <div className="flex items-center justify-center min-h-screen">
          <Spinner />
        </div>
      </AuthLoading>
      <Unauthenticated>
        <UnauthenticatedRedirect />
      </Unauthenticated>
      <Authenticated>
        <AdminContent />
      </Authenticated>
    </>
  );
}

function AdminContent() {
  const dotGridStyle = useDotGridStyle();

  return (
    <div className="min-h-screen" style={dotGridStyle}>
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/admin" className="font-display font-semibold text-foreground">
              ASTN Admin
            </Link>
            <nav className="flex gap-4">
              <Link
                to="/admin/opportunities"
                className="text-sm text-muted-foreground hover:text-foreground"
                activeProps={{ className: "text-sm text-foreground font-medium" }}
              >
                Opportunities
              </Link>
            </nav>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/">View Site</Link>
          </Button>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}

function UnauthenticatedRedirect() {
  const navigate = useNavigate();
  navigate({ to: "/login" });
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Spinner />
    </div>
  );
}
