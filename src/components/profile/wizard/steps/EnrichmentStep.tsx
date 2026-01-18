import { useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import {
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import { EnrichmentChat } from "../../enrichment/EnrichmentChat";
import { ExtractionReview } from "../../enrichment/ExtractionReview";
import { useEnrichment } from "../../enrichment/hooks/useEnrichment";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

interface EnrichmentStepProps {
  profile: {
    _id: Id<"profiles">;
    hasEnrichmentConversation?: boolean;
  } | null;
  fromExtraction?: boolean;
}

export function EnrichmentStep({ profile, fromExtraction }: EnrichmentStepProps) {
  const [mode, setMode] = useState<"chat" | "review">("chat");
  const [isApplying, setIsApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const hasAutoGreeted = useRef(false);

  const updateField = useMutation(api.profiles.updateField);

  const {
    messages,
    input,
    setInput,
    isLoading,
    error,
    shouldShowExtract,
    isExtracting,
    extractions,
    sendMessage,
    extractProfile,
    updateExtractionStatus,
    updateExtractionValue,
    resetExtractions,
  } = useEnrichment(profile?._id ?? null);

  // Auto-send greeting when arriving from resume extraction
  useEffect(() => {
    if (
      fromExtraction &&
      profile?._id &&
      messages.length === 0 &&
      !isLoading &&
      !hasAutoGreeted.current
    ) {
      hasAutoGreeted.current = true;
      // Send a greeting to trigger the LLM to acknowledge the imported data
      void sendMessage("Hi! I just imported my resume. Can you help me complete my profile?");
    }
  }, [fromExtraction, profile?._id, messages.length, isLoading, sendMessage]);

  const handleExtract = async () => {
    await extractProfile();
    setMode("review");
  };

  const handleApply = async () => {
    if (!profile?._id || !extractions) return;

    setIsApplying(true);

    try {
      // Build updates from accepted/edited extractions
      const updates: Record<string, unknown> = {
        hasEnrichmentConversation: true,
      };

      for (const item of extractions) {
        if (item.status === "accepted" || item.status === "edited") {
          const value = item.editedValue ?? item.value;

          // Map extraction fields to profile fields
          switch (item.field) {
            case "skills_mentioned":
              updates.skills = value;
              break;
            case "career_interests":
              updates.aiSafetyInterests = value;
              break;
            case "career_goals":
              updates.careerGoals = value;
              break;
            case "background_summary":
              updates.enrichmentSummary = value;
              break;
            case "seeking":
              updates.seeking = value;
              break;
          }
        }
      }

      await updateField({
        profileId: profile._id,
        updates: updates as Parameters<typeof updateField>[0]["updates"],
      });

      setApplied(true);
      setMode("chat");
      resetExtractions();
    } catch (err) {
      console.error("Failed to apply extractions:", err);
    } finally {
      setIsApplying(false);
    }
  };

  const handleBack = () => {
    setMode("chat");
  };

  const handleContinue = () => {
    setApplied(false);
    resetExtractions();
  };

  // Show loading state while profile is loading
  if (!profile) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Profile Enrichment
          </h2>
          <p className="text-sm text-slate-500 mt-1">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Profile Enrichment
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Have a conversation with our AI career coach to enhance your profile.
          </p>
        </div>
        {messages.length > 0 && (
          <Badge variant="secondary" className="gap-1">
            <MessageSquare className="size-3" />
            {messages.length} messages
          </Badge>
        )}
      </div>

      {/* Success message after applying */}
      {applied && (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="size-5 text-green-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-green-800">
                Profile updated successfully!
              </p>
              <p className="text-sm text-green-700 mt-1">
                The extracted information has been added to your profile. You can
                continue the conversation to add more details.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleContinue}
              className="text-green-700 hover:text-green-800 hover:bg-green-100"
            >
              <RefreshCw className="size-4 mr-1" />
              Continue
            </Button>
          </div>
        </Card>
      )}

      {/* Error message */}
      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="size-5 text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-red-800">Something went wrong</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Main content */}
      <Card className="overflow-hidden">
        {mode === "chat" ? (
          <EnrichmentChat
            messages={messages}
            input={input}
            onInputChange={setInput}
            onSendMessage={sendMessage}
            isLoading={isLoading}
            disabled={applied}
          />
        ) : extractions ? (
          <div className="p-6">
            <ExtractionReview
              extractions={extractions}
              onUpdateStatus={updateExtractionStatus}
              onUpdateValue={updateExtractionValue}
              onApply={handleApply}
              onBack={handleBack}
              isApplying={isApplying}
            />
          </div>
        ) : null}
      </Card>

      {/* Extract button */}
      {mode === "chat" && messages.length > 0 && !applied && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {shouldShowExtract ? (
              <span className="text-green-600 font-medium">
                Ready to extract your profile information!
              </span>
            ) : (
              "Continue the conversation to share more about your background."
            )}
          </p>
          <Button
            onClick={handleExtract}
            disabled={isExtracting || messages.length < 2}
            variant={shouldShowExtract ? "default" : "outline"}
            className="gap-2"
          >
            {isExtracting ? (
              <>
                <RefreshCw className="size-4 animate-spin" />
                Extracting...
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                See what I learned
              </>
            )}
          </Button>
        </div>
      )}

      {/* Previous conversation indicator */}
      {profile.hasEnrichmentConversation && messages.length === 0 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="size-5 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-blue-800">
                You have previously completed enrichment
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Start a new conversation if you would like to update your profile with
                additional information.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
