import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Globe, Users, Lock } from "lucide-react";

interface SectionVisibilityProps {
  section: string;
  label: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  defaultVisibility: "public" | "connections" | "private";
}

const VISIBILITY_OPTIONS = [
  {
    value: "default",
    label: "Use default",
    icon: null,
  },
  {
    value: "public",
    label: "Public",
    description: "Anyone can see",
    icon: Globe,
  },
  {
    value: "connections",
    label: "Connections only",
    description: "Only connected users",
    icon: Users,
  },
  {
    value: "private",
    label: "Private",
    description: "Only you",
    icon: Lock,
  },
];

const DEFAULT_LABELS = {
  public: "Public",
  connections: "Connections",
  private: "Private",
};

export function SectionVisibility({
  label,
  value,
  onChange,
  defaultVisibility,
}: SectionVisibilityProps) {
  const currentValue = value ?? "default";
  const effectiveVisibility = value ?? defaultVisibility;
  const EffectiveIcon =
    VISIBILITY_OPTIONS.find((o) => o.value === effectiveVisibility)?.icon ??
    Globe;

  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-b-0">
      <div className="flex items-center gap-3">
        <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center">
          <EffectiveIcon className="size-4 text-slate-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-900">{label}</p>
          <p className="text-xs text-slate-500">
            {value
              ? `Override: ${VISIBILITY_OPTIONS.find((o) => o.value === value)?.label}`
              : `Using default (${DEFAULT_LABELS[defaultVisibility]})`}
          </p>
        </div>
      </div>

      <Select
        value={currentValue}
        onValueChange={(v) => onChange(v === "default" ? undefined : v)}
      >
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="default">
            <span className="flex items-center gap-2">
              Use default ({DEFAULT_LABELS[defaultVisibility]})
            </span>
          </SelectItem>
          {VISIBILITY_OPTIONS.filter((o) => o.value !== "default").map(
            (option) => {
              const Icon = option.icon!;
              return (
                <SelectItem key={option.value} value={option.value}>
                  <span className="flex items-center gap-2">
                    <Icon className="size-3.5" />
                    {option.label}
                  </span>
                </SelectItem>
              );
            }
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
