"use client";

import { ConceptCard } from "@/lib/types";

interface ConceptsSidebarProps {
  concepts: ConceptCard[];
  isOpen: boolean;
  onToggle: () => void;
}

const DIFFICULTY_COLORS = {
  beginner: { bg: "#4CAF7D22", text: "#4CAF7D", border: "#4CAF7D44" },
  intermediate: { bg: "#4A90D922", text: "#4A90D9", border: "#4A90D944" },
  advanced: { bg: "#E5A83222", text: "#E5A832", border: "#E5A83244" },
};

export default function ConceptsSidebar({ concepts, isOpen, onToggle }: ConceptsSidebarProps) {
  return (
    <div
      className={`shrink-0 border-l border-[#222] bg-[#0a0a0a] transition-all duration-300 overflow-hidden ${
        isOpen ? "w-72" : "w-10"
      }`}
    >
      {/* Toggle */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-center py-3 text-[#666] hover:text-[#aaa] transition-colors border-b border-[#222]"
        title={isOpen ? "Collapse concepts" : "Expand concepts"}
      >
        {isOpen ? (
          <span className="text-xs font-mono tracking-wider">CONCEPTS ›</span>
        ) : (
          <span className="text-xs font-mono" style={{ writingMode: "vertical-rl" }}>
            CONCEPTS
          </span>
        )}
      </button>

      {isOpen && (
        <div className="p-3 space-y-3 overflow-y-auto h-[calc(100%-44px)]">
          {concepts.length === 0 ? (
            <p className="text-xs text-[#555] text-center py-8">
              Concepts will appear here as you analyze code
            </p>
          ) : (
            concepts.map((concept) => {
              const colors = DIFFICULTY_COLORS[concept.difficulty];
              return (
                <div
                  key={concept.id}
                  className="rounded-lg border p-3 space-y-2"
                  style={{ borderColor: colors.border, background: colors.bg }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-semibold text-white leading-tight">
                      {concept.title}
                    </h4>
                    <span
                      className="text-[9px] font-mono tracking-wider px-1.5 py-0.5 rounded shrink-0"
                      style={{ color: colors.text, background: `${colors.text}22` }}
                    >
                      {concept.difficulty.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-[#aaa] leading-relaxed">
                    {concept.principle}
                  </p>
                  <p className="text-xs text-[#666] leading-relaxed italic">
                    {concept.relevance}
                  </p>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
