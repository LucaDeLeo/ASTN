import { Link, Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { AuthLoading, Authenticated, Unauthenticated } from "convex/react";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";

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
        <div
          className="min-h-screen"
          style={{
            backgroundImage: `radial-gradient(circle, oklch(0.65 0.08 30 / 0.25) 1.5px, transparent 1.5px)`,
            backgroundSize: '20px 20px',
            backgroundColor: 'oklch(0.98 0.01 90)'
          }}
        >
          <header className="border-b bg-white">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <Link to="/admin" className="font-display font-semibold text-slate-900">
                  ASTN Admin
                </Link>
                <nav className="flex gap-4">
                  <Link
                    to="/admin/opportunities"
                    className="text-sm text-slate-600 hover:text-slate-900"
                    activeProps={{ className: "text-sm text-slate-900 font-medium" }}
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
      </Authenticated>
    </>
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
