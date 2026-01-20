import { Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";

export function PublicHeader() {
  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="font-semibold text-foreground font-mono">
          AI Safety Talent Network
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            to="/opportunities"
            className="text-sm text-slate-600 hover:text-foreground [&.active]:text-foreground [&.active]:font-medium"
          >
            Opportunities
          </Link>
          <Button size="sm" variant="outline" asChild>
            <Link to="/admin">Admin</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
