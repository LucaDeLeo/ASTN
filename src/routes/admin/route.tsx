import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/admin" className="font-semibold text-slate-900">
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
  );
}
