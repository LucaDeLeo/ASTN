import { useCallback, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

export function useAutoSave(profileId: Id<"profiles"> | null, debounceMs = 500) {
  const updateField = useMutation(api.profiles.updateField);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pendingUpdatesRef = useRef<Record<string, unknown>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const saveField = useCallback(
    (field: string, value: unknown) => {
      if (!profileId) return;

      // Accumulate pending updates
      pendingUpdatesRef.current[field] = value;

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setIsSaving(true);

      // Set new timeout
      timeoutRef.current = setTimeout(async () => {
        const updates = { ...pendingUpdatesRef.current };
        pendingUpdatesRef.current = {};

        try {
          await updateField({
            profileId,
            updates: updates as Parameters<typeof updateField>[0]["updates"],
          });
          setLastSaved(new Date());
        } catch (error) {
          console.error("Failed to save profile field:", error);
        } finally {
          setIsSaving(false);
        }
      }, debounceMs);
    },
    [profileId, updateField, debounceMs]
  );

  // Immediate save without debounce (for arrays)
  const saveFieldImmediate = useCallback(
    async (field: string, value: unknown) => {
      if (!profileId) return;

      setIsSaving(true);
      try {
        await updateField({
          profileId,
          updates: { [field]: value } as Parameters<
            typeof updateField
          >[0]["updates"],
        });
        setLastSaved(new Date());
      } catch (error) {
        console.error("Failed to save profile field:", error);
      } finally {
        setIsSaving(false);
      }
    },
    [profileId, updateField]
  );

  return { saveField, saveFieldImmediate, isSaving, lastSaved };
}
