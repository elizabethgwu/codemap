"use client";

import { AnalysisResult, NODE_CONFIG, CodeNode } from "@/lib/types";

interface CodePanelProps {
  analysis: AnalysisResult;
  selectedNodeId: string | null;
  onNodeSelect: (nodeId: string | null) => void;
}

export default function CodePanel({ analysis, selectedNodeId, onNodeSelect }: CodePanelProps) {
  const lines = analysis.code.split("\n");

  // Build a map of line -> node(s) for highlighting
  const lineNodeMap = new Map<number, CodeNode[]>();
  analysis.nodes.forEach((node) => {
    for (let i = node.codeRange.startLine; i <= node.codeRange.endLine; i++) {
      const existing = lineNodeMap.get(i) || [];
      existing.push(node);
      lineNodeMap.set(i, existing);
    }
  });

  // Find decision nodes for overlay annotations
  const decisionAnnotations = analysis.nodes
    .filter((n) => n.type === "decision" && n.decision)
    .map((n) => ({
      node: n,
      line: n.codeRange.startLine,
    }));

  const getLineHighlight = (lineNum: number) => {
    const nodes = lineNodeMap.get(lineNum);
    if (!nodes || nodes.length === 0) return null;

    // If a node is selected, only highlight that node's lines
    if (selectedNodeId) {
      const selectedNode = nodes.find((n) => n.id === selectedNodeId);
      if (selectedNode) {
        return NODE_CONFIG[selectedNode.type];
      }
      return null;
    }

    // Default: show first node's color
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
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#222]">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-[#666]">{analysis.language}</span>
          <span className="text-[#333]">|</span>
          <span className="text-xs text-[#888]">{lines.length} lines</span>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-3">
          {(Object.entries(NODE_CONFIG) as [string, typeof NODE_CONFIG.scope][]).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className="text-xs">{cfg.icon}</span>
              <span className="text-[10px] font-mono text-[#666]">{cfg.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Code */}
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
                {/* Decision overlay annotation */}
                {annotation && annotation.node.decision && (
                  <div
                    className="flex items-center gap-2 px-4 py-1.5 text-xs border-l-2 ml-12 mr-4 my-1 rounded-r"
                    style={{
                      borderColor: NODE_CONFIG.decision.color,
                      background: `${NODE_CONFIG.decision.color}11`,
                    }}
                  >
                    <span style={{ color: NODE_CONFIG.decision.color }}>⟐</span>
                    <span className="text-[#888]">
                      <strong className="text-[#ccc] font-medium">Decision:</strong>{" "}
                      {annotation.node.decision.chose}
                      <span className="text-[#555]"> — {annotation.node.decision.because}</span>
                    </span>
                  </div>
                )}

                {/* Block start marker */}
                {isBlockStart && highlight && (
                  <div
                    className="flex items-center gap-1.5 px-4 py-0.5 ml-12"
                    style={{ color: highlight.color }}
                  >
                    <span className="text-[10px]">{highlight.icon}</span>
                    <span className="text-[10px] font-mono tracking-wider opacity-60">
                      {node.label.toUpperCase()}
                    </span>
                  </div>
                )}

                <div
                  className={`flex items-start group cursor-pointer transition-colors ${
                    highlight ? "hover:bg-white/5" : "hover:bg-white/[0.02]"
                  }`}
                  style={{
                    background: highlight
                      ? selectedNodeId && node?.id === selectedNodeId
                        ? `${highlight.color}18`
                        : `${highlight.color}08`
                      : undefined,
                    borderLeft: highlight
                      ? `3px solid ${highlight.color}${selectedNodeId && node?.id === selectedNodeId ? "aa" : "44"}`
                      : "3px solid transparent",
                  }}
                  onClick={() => {
                    if (node) {
                      onNodeSelect(node.id === selectedNodeId ? null : node.id);
                    }
                  }}
                >
                  <span className="w-12 shrink-0 text-right pr-3 select-none text-[#444] text-xs leading-6">
                    {lineNum}
                  </span>
                  <pre className="flex-1 pr-4 text-[#d4d4d4] overflow-x-auto">
                    <code>{line || " "}</code>
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
