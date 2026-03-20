"use client";

import { useState, useRef, useEffect } from "react";

interface ChatInputProps {
  onSubmit: (message: string) => void;
  isLoading: boolean;
}

const EXAMPLE_PROMPTS = [
  "Write a Python function to find the longest palindromic substring",
  "Build a rate limiter using the token bucket algorithm in JavaScript",
  "Write a binary search tree with insert and search in Python",
  "Create a debounce function in TypeScript with cancel support",
];

export default function ChatInput({ onSubmit, isLoading }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSubmit(trimmed);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-[#222] bg-[#0a0a0a]">
      {/* Example prompts when empty */}
      {!input && !isLoading && (
        <div className="px-4 pt-3 pb-1 flex flex-wrap gap-2">
          {EXAMPLE_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              onClick={() => setInput(prompt)}
              className="text-[11px] px-2.5 py-1.5 rounded-md border border-[#222] text-[#666] hover:text-[#aaa] hover:border-[#444] transition-colors truncate max-w-[280px]"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-end gap-3 p-4">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Paste code or describe a coding problem..."
          disabled={isLoading}
          rows={1}
          className="flex-1 bg-[#151515] border border-[#2a2a2a] rounded-lg px-4 py-3 text-sm text-[#d4d4d4] placeholder-[#555] resize-none focus:outline-none focus:border-[#444] transition-colors font-mono disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || isLoading}
          className="shrink-0 px-5 py-3 rounded-lg text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-white text-black hover:bg-[#ddd] active:scale-[0.98]"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              Analyzing
            </span>
          ) : (
            "Analyze"
          )}
        </button>
      </div>
    </div>
  );
}
