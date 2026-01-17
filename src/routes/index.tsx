import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4 font-mono tracking-tight">
            AI Safety Talent Network
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Find opportunities in AI safety research, policy, and engineering.
          </p>
          <Button
            asChild
            size="lg"
            className="transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Link to="/opportunities">Browse Opportunities</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
