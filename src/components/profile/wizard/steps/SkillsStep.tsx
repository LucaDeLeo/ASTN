import { Lightbulb } from "lucide-react";
import { Card } from "~/components/ui/card";

export function SkillsStep() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Skills</h2>
        <p className="text-sm text-slate-500 mt-1">
          Add your technical and professional skills relevant to AI safety work.
        </p>
      </div>

      <Card className="p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="size-12 rounded-full bg-amber-100 flex items-center justify-center">
            <Lightbulb className="size-6 text-amber-600" />
          </div>
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-2">Coming Soon</h3>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          Skills selection with AI safety taxonomy suggestions will be available
          in a future update. You will be able to search from a curated list of
          skills and add your own.
        </p>
      </Card>
    </div>
  );
}
