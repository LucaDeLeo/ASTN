import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";

export const Route = createFileRoute("/_public")({
  component: PublicLayout,
});

function PublicLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="font-semibold text-slate-900">
            AI Safety Talent Network
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              to="/opportunities"
              className="text-sm text-slate-600 hover:text-slate-900 [&.active]:text-slate-900 [&.active]:font-medium"
            >
              Opportunities
            </Link>
            <Button size="sm" variant="outline" asChild>
              <Link to="/admin">Admin</Link>
            </Button>
          </nav>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
