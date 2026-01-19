import { useState } from "react";
import {
  Upload,
  ClipboardPaste,
  PenLine,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { Card } from "~/components/ui/card";

type EntryPoint = "upload" | "paste" | "manual" | "chat";

interface EntryPointSelectorProps {
  onSelect: (entryPoint: EntryPoint) => void;
  disabled?: boolean;
}

interface EntryOption {
  id: EntryPoint;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  isPrimary?: boolean;
}

const ENTRY_OPTIONS: EntryOption[] = [
  {
    id: "upload",
    icon: Upload,
    label: "Upload your resume",
    description: "We'll extract your info automatically",
    isPrimary: true,
  },
  {
    id: "paste",
    icon: ClipboardPaste,
    label: "Paste text",
    description: "Copy from LinkedIn or your resume",
  },
  {
    id: "manual",
    icon: PenLine,
    label: "Fill out manually",
    description: "Enter your information step by step",
  },
  {
    id: "chat",
    icon: MessageSquare,
    label: "Chat with AI",
    description: "Let our AI guide you through the process",
  },
];

function LinkedInPdfTip() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="ml-12 mt-2">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {isExpanded ? (
          <ChevronUp className="size-3" />
        ) : (
          <ChevronDown className="size-3" />
        )}
        How to get your LinkedIn PDF
      </button>
      {isExpanded && (
        <div className="mt-2 text-xs text-muted-foreground space-y-1 pl-4 border-l-2 border-slate-200">
          <p>1. Go to your LinkedIn profile</p>
          <p>2. Click the "More" button under your name</p>
          <p>3. Select "Save to PDF"</p>
        </div>
      )}
    </div>
  );
}

export function EntryPointSelector({
  onSelect,
  disabled = false,
}: EntryPointSelectorProps) {
  return (
    <div className="space-y-3">
      {ENTRY_OPTIONS.map((option) => {
        const Icon = option.icon;
        const isPrimary = option.isPrimary;

        return (
          <div key={option.id}>
            <Card
              onClick={() => !disabled && onSelect(option.id)}
              className={cn(
                "cursor-pointer transition-all py-4",
                disabled && "opacity-50 cursor-not-allowed",
                isPrimary
                  ? "border-primary bg-primary/5 hover:bg-primary/10 hover:border-primary/80"
                  : "hover:bg-slate-50 hover:border-slate-300"
              )}
            >
              <div className="flex items-center gap-4 px-4">
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-lg",
                    isPrimary
                      ? "bg-primary/10 text-primary"
                      : "bg-slate-100 text-slate-600"
                  )}
                >
                  <Icon className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className={cn(
                      "font-medium",
                      isPrimary ? "text-primary" : "text-slate-900"
                    )}
                  >
                    {option.label}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {option.description}
                  </div>
                </div>
                {isPrimary && (
                  <span className="shrink-0 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                    Recommended
                  </span>
                )}
              </div>
            </Card>
            {option.id === "upload" && <LinkedInPdfTip />}
          </div>
        );
      })}
    </div>
  );
}
