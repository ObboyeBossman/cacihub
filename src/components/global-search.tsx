"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Search, X, BookOpen, Radio, Calendar, User, ArrowRight, Loader2,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import type { SearchResultDTO, SearchResultType } from "@/lib/types";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

const TYPE_META: Record<SearchResultType, { label: string; icon: React.ReactNode; color: string }> = {
  sermon:    { label: "Sermon",    icon: <BookOpen size={15} />,  color: "bg-caci-blue-bg text-caci-blue" },
  broadcast: { label: "Broadcast", icon: <Radio size={15} />,     color: "bg-caci-red-bg text-caci-red" },
  event:     { label: "Event",     icon: <Calendar size={15} />,  color: "bg-[#dafbe1] text-[#1a7f37]" },
  member:    { label: "Member",    icon: <User size={15} />,      color: "bg-[#fff8c5] text-[#9a6700]" },
};

export function GlobalSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { navigate, setParam } = useApp();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setResults([]);
      setActiveIndex(0);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await api.search.global(query.trim());
        setResults(res.results);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[activeIndex]) {
      e.preventDefault();
      handleSelect(results[activeIndex]);
    } else if (e.key === "Escape") {
      onOpenChange(false);
    }
  }, [results, activeIndex, onOpenChange]);

  const handleSelect = (result: SearchResultDTO) => {
    // Navigate based on type
    if (result.type === "sermon") {
      setParam("sermonId", result.id);
      navigate("member-sermon-detail");
    } else if (result.type === "broadcast") {
      setParam("broadcastId", result.id);
      navigate("member-broadcast-detail");
    } else if (result.type === "event") {
      setParam("eventId", result.id);
      navigate("member-events");
    } else if (result.type === "member") {
      // Navigate to directory — can't open a specific member sheet from here
      navigate("member-directory");
    }
    onOpenChange(false);
  };

  if (!open) return null;

  // Group results by type
  const grouped: Record<SearchResultType, SearchResultDTO[]> = {
    sermon: [], broadcast: [], event: [], member: [],
  };
  for (const r of results) grouped[r.type].push(r);

  const flatResults = results;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
      onClick={() => onOpenChange(false)}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-n100">
          <Search size={20} className="text-n400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
            placeholder="Search sermons, broadcasts, events, members…"
            className="flex-1 text-[16px] text-n900 placeholder:text-n300 outline-none bg-transparent"
          />
          {loading && <Loader2 size={18} className="text-caci-blue animate-spin shrink-0" />}
          <button
            onClick={() => onOpenChange(false)}
            className="size-7 flex items-center justify-center rounded-md text-n400 hover:text-n700 hover:bg-n50 shrink-0"
            aria-label="Close search"
          >
            <X size={16} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto scroll-caci">
          {query.trim().length < 2 ? (
            <div className="py-12 px-4 text-center">
              <Search size={32} className="text-n200 mx-auto mb-2" />
              <p className="text-[14px] text-n400">Start typing to search across the assembly</p>
            </div>
          ) : flatResults.length === 0 && !loading ? (
            <div className="py-12 px-4 text-center">
              <p className="text-[14px] text-n400">No results for "{query}"</p>
              <p className="text-[12px] text-n300 mt-1">Try a different search term</p>
            </div>
          ) : (
            <div className="py-2">
              {(Object.entries(grouped) as [SearchResultType, SearchResultDTO[]][])
                .filter(([, items]) => items.length > 0)
                .map(([type, items]) => (
                  <div key={type} className="mb-1">
                    <p className="px-4 py-1.5 text-[11px] font-semibold text-n400 uppercase tracking-wide">
                      {TYPE_META[type].label}s
                    </p>
                    {items.map((r) => {
                      const flatIdx = flatResults.indexOf(r);
                      const isActive = flatIdx === activeIndex;
                      const meta = TYPE_META[r.type];
                      return (
                        <button
                          key={`${r.type}-${r.id}`}
                          onClick={() => handleSelect(r)}
                          onMouseEnter={() => setActiveIndex(flatIdx)}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                            isActive ? "bg-caci-blue-bg" : "hover:bg-n50",
                          )}
                        >
                          <div className={cn("size-8 rounded-lg flex items-center justify-center shrink-0", meta.color)}>
                            {meta.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-[14px] truncate", isActive ? "font-semibold text-caci-blue" : "font-medium text-n900")}>
                              {r.title}
                            </p>
                            {r.subtitle && (
                              <p className="text-[12px] text-n400 truncate">{r.subtitle}</p>
                            )}
                          </div>
                          {r.date && (
                            <span className="text-[11px] text-n400 shrink-0">{formatRelative(r.date)}</span>
                          )}
                          <ArrowRight size={14} className={cn("shrink-0 transition-opacity", isActive ? "text-caci-blue opacity-100" : "opacity-0")} />
                        </button>
                      );
                    })}
                  </div>
                ))
              }
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t border-n100 px-4 py-2 flex items-center justify-between text-[11px] text-n400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border border-n200 bg-n50 text-[10px] font-semibold">↑↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border border-n200 bg-n50 text-[10px] font-semibold">↵</kbd>
              select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border border-n200 bg-n50 text-[10px] font-semibold">esc</kbd>
              close
            </span>
          </div>
          <span>{flatResults.length} result{flatResults.length !== 1 ? "s" : ""}</span>
        </div>
      </div>
    </div>
  );
}
