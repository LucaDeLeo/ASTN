import { BookOpen, Briefcase, TrendingUp, Wrench } from "lucide-react";
import { Card } from "~/components/ui/card";

interface GrowthAreasProps {
  areas: Array<{
    theme: string;
    items: Array<string>;
  }>;
}

const themeIcons: Record<string, typeof TrendingUp> = {
  "Skills to build": Wrench,
  "Experience to gain": Briefcase,
  "Knowledge to deepen": BookOpen,
};

export function GrowthAreas({ areas }: GrowthAreasProps) {
  if (areas.length === 0) return null;

  return (
    <Card className="p-6 bg-slate-50">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="size-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Your Growth Areas</h2>
      </div>
      <p className="text-sm text-slate-500 mb-4">
        Based on your matches, here are areas to focus on to improve your fit
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {areas.map((area) => {
          const Icon = themeIcons[area.theme] ?? TrendingUp;
          return (
            <div key={area.theme} className="bg-white rounded-lg p-4 border">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="size-4 text-slate-400" />
                <h3 className="font-medium text-foreground">{area.theme}</h3>
              </div>
              <ul className="space-y-1 text-sm text-slate-600">
                {area.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary">-</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
