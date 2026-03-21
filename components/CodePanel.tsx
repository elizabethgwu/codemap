"use client";

import { useEffect, useRef } from "react";
import { AnalysisResult, NODE_CONFIG, CodeNode } from "@/lib/types";

declare global {
  interface Window {
    Prism: {
      highlight: (code: string, grammar: unknown, language: string) => string;
      languages: Record<string, unknown>;
    };
  }
}

interface CodePanelProps {
  submittedCode: string | null;
  analysis: AnalysisResult | null;
  selectedNodeId: string | null;
  onNodeSelect: (nodeId: string | null) => void;
}

function getLanguageAlias(lang: string): string {
  const map: Record<string, string> = {
    javascript: "javascript", typescript: "typescript", python: "python",
    py: "python", js: "javascript", ts: "typescript", rust: "rust",
    go: "go", java: "java", cpp: "cpp", "c++": "cpp", c: "c",
    css: "css", html: "html", bash: "bash", sh: "bash", json: "json", sql: "sql",
  };
  return map[lang?.toLowerCase()] || "javascript";
}

function HighlightedLine({ code, language }: { code: string; language: string }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    if (ref.current && typeof window !== "undefined" && window.Prism) {
      const grammar = window.Prism.languages[language];
      if (grammar) {
        ref.current.innerHTML = window.Prism.highlight(code || " ", grammar, language);
      } else {
        ref.current.textContent = code || " ";
      }
    }
  }, [code, language]);
  return <code ref={ref} className={`language-${language}`}>{code || " "}</code>;
}

export default function CodePanel({ submittedCode, analysis, selectedNodeId, onNodeSelect }: CodePanelProps) {
  const code = analysis?.code ?? submittedCode ?? "";
  const language = analysis?.language ? getLanguageAlias(analysis.language) : "javascript";
  const lines = code.split("\n");

  const lineNodeMap = new Map<number, CodeNode[]>();
  if (analysis) {
    analysis.nodes.forEach((node) => {
      for (let i = node.codeRange.startLine; i <= node.codeRange.endLine; i++) {
        const existing = lineNodeMap.get(i) || [];
        existing.push(node);
        lineNodeMap.set(i, existing);
      }
    });
  }

  const decisionAnnotations = analysis
    ? analysis.nodes.filter((n) => n.type === "decision" && n.decision).map((n) => ({ node: n, line: n.codeRange.startLine }))
    : [];

  const getLineHighlight = (lineNum: number) => {
    const nodes = lineNodeMap.get(lineNum);
    if (!nodes || nodes.length === 0) return null;
    if (selectedNodeId) {
      const selectedNode = nodes.find((n) => n.id === selectedNodeId);
      return selectedNode ? NODE_CONFIG[selectedNode.type] : null;
    }
    return NODE_CONFIG[nodes[0].type];
  };

  const getNodeForLine = (lineNum: number): CodeNode | undefined => {
    const nodes = lineNodeMap.get(lineNum);
    if (!nodes) return undefined;
    if (selectedNodeId) return nodes.find((n) => n.id === selectedNodeId);
    return nodes[0];
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#222] shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-[#666]">{analysis?.language ?? "code"}</span>
          <span className="text-[#333]">|</span>
          <span className="text-xs text-[#888]">{lines.length} lines</span>
        </div>
        {analysis && (
          <div className="flex items-center gap-3">
            {(Object.entries(NODE_CONFIG) as [string, typeof NODE_CONFIG.scope][]).map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-1.5">
                <span className="text-xs">{cfg.icon}</span>
                <span className="text-[10px] font-mono text-[#666]">{cfg.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto font-mono text-sm leading-6">
        <div className="relative">
          {lines.map((line, i) => {
            const lineNum = i + 1;
            const highlight = getLineHighlight(lineNum);
            const node = getNodeForLine(lineNum);
            const isBlockStart = node && node.codeRange.startLine === lineNum;
            const annotation = decisionAnnotations.find((a) => a.line === lineNum);

            return (
              <div key={i}>
                {annotation && annotation.node.decision && (
                  <div
                    className="flex items-center gap-2 px-4 py-1.5 text-xs border-l-2 ml-12 mr-4 my-1 rounded-r"
                    style={{ borderColor: NODE_CONFIG.decision.color, background: `${NODE_CONFIG.decision.color}11` }}
                  >
                    <span style={{ color: NODE_CONFIG.decision.color }}>⟐</span>
                    <span className="text-[#888]">
                      <strong className="text-[#ccc] font-medium">Decision:</strong>{" "}
                      {annotation.node.decision.chose}
                      <span className="text-[#555]"> — {annotation.node.decision.because}</span>
                    </span>
                  </div>
                )}
                {isBlockStart && highlight && (
                  <div className="flex items-center gap-1.5 px-4 py-0.5 ml-12" style={{ color: highlight.color }}>
                    <span className="text-[10px]">{highlight.icon}</span>
                    <span className="text-[10px] font-mono tracking-wider opacity-60">{node.label.toUpperCase()}</span>
                  </div>
                )}
                <div
                  className={`flex items-start group transition-colors ${analysis ? "cursor-pointer" : ""} ${highlight ? "hover:bg-white/5" : "hover:bg-white/[0.02]"}`}
                  style={{
                    background: highlight
                      ? selectedNodeId && node?.id === selectedNodeId ? `${highlight.color}18` : `${highlight.color}08`
                      : undefined,
                    borderLeft: highlight
                      ? `3px solid ${highlight.color}${selectedNodeId && node?.id === selectedNodeId ? "aa" : "44"}`
                      : "3px solid transparent",
                  }}
                  onClick={() => { if (node && analysis) onNodeSelect(node.id === selectedNodeId ? null : node.id); }}
                >
                  <span className="w-12 shrink-0 text-right pr-3 select-none text-[#444] text-xs leading-6">{lineNum}</span>
                  <pre className="flex-1 pr-4 overflow-x-auto">
                    <HighlightedLine code={line} language={language} />
                  </pre>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
