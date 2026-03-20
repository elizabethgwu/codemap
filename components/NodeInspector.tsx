"use client";

import { CodeNode, NODE_CONFIG } from "@/lib/types";

interface NodeInspectorProps {
  node: CodeNode | null;
  onClose: () => void;
}

export default function NodeInspector({ node, onClose }: NodeInspectorProps) {
  if (!node) return null;

  const config = NODE_CONFIG[node.type];

  return (
    <div
      className="absolute top-4 right-4 w-80 max-h-[calc(100%-2rem)] overflow-y-auto rounded-lg border bg-[#0f0f0f]/95 backdrop-blur-md shadow-2xl"
      style={{ borderColor: `${config.color}44` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: `${config.color}33` }}>
        <div className="flex items-center gap-2">
          <span
            className="w-7 h-7 rounded flex items-center justify-center text-sm font-bold"
            style={{ background: `${config.color}22`, color: config.color }}
          >
            {config.icon}
          </span>
          <div>
            <div className="text-sm font-semibold text-white">{node.label}</div>
            <div className="text-[10px] font-mono tracking-wider" style={{ color: config.color }}>
              {config.label} · Lines {node.codeRange.startLine}–{node.codeRange.endLine}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded flex items-center justify-center text-[#666] hover:text-white hover:bg-[#333] transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Description */}
      <div className="px-4 py-3 border-b border-[#222]">
        <p className="text-sm text-[#aaa] leading-relaxed">{node.description}</p>
      </div>

      {/* Variables */}
      {node.variables.length > 0 && (
        <div className="px-4 py-3 border-b border-[#222]">
          <h4 className="text-[10px] font-mono tracking-wider text-[#666] uppercase mb-2">
            Variables at this point
          </h4>
          <div className="space-y-1.5">
            {node.variables.map((v, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <code className="font-mono text-[#e0e0e0] bg-[#1a1a1a] px-1.5 py-0.5 rounded shrink-0">
                  {v.name}
                </code>
                <span className="text-[#666]">:</span>
                <span className="text-[#888] font-mono">{v.type}</span>
                {v.value && (
                  <span className="text-[#555]">= {v.value}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assumptions */}
      {node.assumptions.length > 0 && (
        <div className="px-4 py-3 border-b border-[#222]">
          <h4 className="text-[10px] font-mono tracking-wider text-[#666] uppercase mb-2">
            Assumptions
          </h4>
          <div className="space-y-2">
            {node.assumptions.map((a, i) => (
              <div key={i} className="text-xs">
                <div className="flex items-start gap-2">
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                      a.confidence === "high"
                        ? "bg-green-500"
                        : a.confidence === "medium"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                  />
                  <span className="text-[#aaa]">{a.text}</span>
                </div>
                {a.alternative && (
                  <div className="ml-3.5 mt-1 text-[#666] italic">
                    Alt: {a.alternative}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Decision (only for decision nodes) */}
      {node.decision && (
        <div className="px-4 py-3">
          <h4 className="text-[10px] font-mono tracking-wider text-[#E5A832] uppercase mb-2">
            ⟐ Decision Made
          </h4>
          <div className="text-xs space-y-2">
            <div>
              <span className="text-[#888]">Chose: </span>
              <span className="text-white font-medium">{node.decision.chose}</span>
            </div>
            <div>
              <span className="text-[#888]">Because: </span>
              <span className="text-[#aaa]">{node.decision.because}</span>
            </div>
            {node.decision.alternatives.length > 0 && (
              <div className="mt-2 space-y-1.5">
                <div className="text-[10px] font-mono tracking-wider text-[#555] uppercase">
                  Alternatives considered
                </div>
                {node.decision.alternatives.map((alt, i) => (
                  <div
                    key={i}
                    className="pl-3 border-l-2 border-[#333]"
                  >
                    <div className="text-[#999]">{alt.option}</div>
                    <div className="text-[#555] mt-0.5">↳ {alt.tradeoff}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
