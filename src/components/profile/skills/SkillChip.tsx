import { X } from "lucide-react";

interface SkillChipProps {
  skill: string;
  onRemove: () => void;
}

export function SkillChip({ skill, onRemove }: SkillChipProps) {
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 bg-coral-100 text-coral-800 rounded-full text-sm transition-colors hover:bg-coral-200">
      {skill}
      <button
        type="button"
        onClick={onRemove}
        className="text-coral-600 hover:text-coral-900 transition-colors focus:outline-none focus:ring-2 focus:ring-coral-500 focus:ring-offset-1 rounded-full"
        aria-label={`Remove ${skill}`}
      >
        <X className="size-3.5" />
      </button>
    </span>
  );
}
