import { useEffect, useMemo, useRef, useState } from "react";
import { useAction, useQuery } from "convex/react";
import { AlertTriangle } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { SkillChip } from "./SkillChip";

interface SkillsInputProps {
  selectedSkills: Array<string>;
  onSkillsChange: (skills: Array<string>) => void;
  maxSuggested?: number;
}

export function SkillsInput({
  selectedSkills,
  onSkillsChange,
  maxSuggested = 10,
}: SkillsInputProps) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLUListElement>(null);

  const taxonomy = useQuery(api.skills.getTaxonomy);
  const ensureTaxonomySeeded = useAction(api.skills.ensureTaxonomySeeded);

  // Seed taxonomy on mount if empty
  useEffect(() => {
    if (taxonomy && taxonomy.length === 0) {
      ensureTaxonomySeeded();
    }
  }, [taxonomy, ensureTaxonomySeeded]);

  // Filter suggestions based on input
  const suggestions = useMemo(() => {
    if (!input.trim() || !taxonomy) return [];
    const lowerInput = input.toLowerCase();
    return taxonomy
      .filter(
        (skill) =>
          skill.name.toLowerCase().includes(lowerInput) &&
          !selectedSkills.includes(skill.name)
      )
      .slice(0, 8);
  }, [input, taxonomy, selectedSkills]);

  // Reset highlighted index when suggestions change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [suggestions]);

  const addSkill = (skill: string) => {
    const trimmedSkill = skill.trim();
    if (trimmedSkill && !selectedSkills.includes(trimmedSkill)) {
      onSkillsChange([...selectedSkills, trimmedSkill]);
    }
    setInput("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const removeSkill = (skill: string) => {
    onSkillsChange(selectedSkills.filter((s) => s !== skill));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        addSkill(suggestions[highlightedIndex].name);
      } else if (input.trim()) {
        // Add custom skill
        addSkill(input.trim());
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && suggestionsRef.current) {
      const highlightedElement = suggestionsRef.current.children[
        highlightedIndex
      ] as HTMLElement;
      highlightedElement?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(e.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showSoftLimit = selectedSkills.length >= maxSuggested;

  return (
    <div className="space-y-3">
      {/* Soft limit warning */}
      {showSoftLimit && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm">
          <AlertTriangle className="size-4 flex-shrink-0" />
          <span>Consider focusing on your top {maxSuggested} skills for better matching</span>
        </div>
      )}

      {/* Selected skills */}
      {selectedSkills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedSkills.map((skill) => (
            <SkillChip
              key={skill}
              skill={skill}
              onRemove={() => removeSkill(skill)}
            />
          ))}
        </div>
      )}

      {/* Input with suggestions dropdown */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder="Type to search skills..."
          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-transparent"
        />

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <ul
            ref={suggestionsRef}
            className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
          >
            {suggestions.map((skill, index) => (
              <li
                key={skill.name}
                onClick={() => addSkill(skill.name)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`px-3 py-2 cursor-pointer flex items-center justify-between ${
                  index === highlightedIndex
                    ? "bg-coral-50"
                    : "hover:bg-slate-50"
                }`}
              >
                <span className="text-slate-900">{skill.name}</span>
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {skill.category}
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* Hint for custom skills */}
        {showSuggestions && input.trim() && suggestions.length === 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg px-3 py-2 text-sm text-slate-600">
            Press Enter to add "{input.trim()}" as a custom skill
          </div>
        )}
      </div>

      {/* Helper text */}
      <p className="text-xs text-slate-500">
        Select from AI safety taxonomy or add your own skills
      </p>
    </div>
  );
}
