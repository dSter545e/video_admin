"use client";

import { KeyboardEvent, useMemo, useState } from "react";

type TagInputProps = {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  fetchSuggestions: (query: string) => Promise<string[]>;
};

const normalize = (value: string) => value.trim().toLowerCase();

export default function TagInput({ value, onChange, placeholder, fetchSuggestions }: TagInputProps) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const normalizedSet = useMemo(() => new Set(value.map((tag) => normalize(tag))), [value]);

  const addTag = (raw: string) => {
    const next = raw.trim();
    if (!next) return;
    if (normalizedSet.has(normalize(next))) return;
    onChange([...value, next]);
  };

  const removeTag = (tag: string) => {
    const target = normalize(tag);
    onChange(value.filter((item) => normalize(item) !== target));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag(input.replace(/,+$/, ""));
      setInput("");
      setSuggestions([]);
    }
  };

  const handleChange = async (nextValue: string) => {
    setInput(nextValue);
    const query = nextValue.trim();
    if (!query) {
      setSuggestions([]);
      return;
    }
    const fetched = await fetchSuggestions(query);
    setSuggestions(fetched.filter((item) => !normalizedSet.has(normalize(item))).slice(0, 8));
  };

  return (
    <div className="sm:col-span-2">
      <div className="mb-2 flex flex-wrap gap-2">
        {value.map((tag) => (
          <button key={tag} type="button" className="admin-chip rounded px-2 py-1 text-xs" onClick={() => removeTag(tag)}>
            #{tag} ×
          </button>
        ))}
      </div>
      <input
        className="admin-input w-full"
        placeholder={placeholder || "Add tag and press Enter or comma"}
        value={input}
        onChange={(event) => void handleChange(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      {suggestions.length ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {suggestions.map((tag) => (
            <button
              key={tag}
              type="button"
              className="rounded border border-[var(--admin-border)] px-2 py-1 text-xs"
              onClick={() => {
                addTag(tag);
                setInput("");
                setSuggestions([]);
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
