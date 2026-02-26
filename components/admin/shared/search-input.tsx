"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchInputProps {
  /** Current search value (controlled) */
  value: string;
  /** Called when user submits or after debounce */
  onSearch: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Debounce delay in ms (0 = no debounce, submit on Enter only) */
  debounceMs?: number;
  className?: string;
}

export function SearchInput({
  value,
  onSearch,
  placeholder = "Search...",
  debounceMs = 0,
  className,
}: SearchInputProps) {
  const [input, setInput] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // Sync controlled value → local input
  useEffect(() => {
    setInput(value);
  }, [value]);

  const handleChange = (v: string) => {
    setInput(v);
    if (debounceMs > 0) {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => onSearch(v), debounceMs);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      clearTimeout(timerRef.current);
      onSearch(input);
    }
  };

  const handleClear = () => {
    setInput("");
    onSearch("");
  };

  return (
    <div className={`relative ${className ?? ""}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        value={input}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="pl-9 pr-8"
      />
      {input && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
