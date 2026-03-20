"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { CodeNode, CodeEdge, NODE_CONFIG } from "@/lib/types";

interface MiniMapProps {
  nodes: CodeNode[];
  edges: CodeEdge[];
  selectedNodeId: string | null;
  onNodeSelect: (nodeId: string) => void;
}

export default function MiniMap({ nodes, edges, selectedNodeId, onNodeSelect }: MiniMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const W = 200;
  const H = 160;

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Simple layout: vertical layers
    const adj = new Map<string, string[]>();
    const inDeg = new Map<string, number>();
    nodes.forEach((n) => { adj.set(n.id, []); inDeg.set(n.id, 0); });
    edges.forEach((e) => {
      adj.get(e.source)?.push(e.target);
      inDeg.set(e.target, (inDeg.get(e.target) || 0) + 1);
    });

    const layers: string[][] = [];
    let queue = nodes.filter((n) => (inDeg.get(n.id) || 0) === 0).map((n) => n.id);
    const visited = new Set<string>();

    while (queue.length > 0) {
      layers.push([...queue]);
      queue.forEach((id) => visited.add(id));
      const next: string[] = [];
      queue.forEach((id) => {
        (adj.get(id) || []).forEach((t) => {
          if (!visited.has(t)) {
            inDeg.set(t, (inDeg.get(t) || 0) - 1);
            if (inDeg.get(t) === 0) next.push(t);
          }
        });
      });
      queue = next;
    }
    nodes.forEach((n) => { if (!visited.has(n.id)) { layers.push([n.id]); visited.add(n.id); } });

    const nodePositions = new Map<string, { x: number; y: number }>();
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const padX = 30, padY = 24;
    const gapY = layers.length > 1 ? (H - padY * 2) / (layers.length - 1) : 0;

    layers.forEach((layer, li) => {
      const gapX = layer.length > 1 ? (W - padX * 2) / (layer.length - 1) : 0;
      layer.forEach((id, ni) => {
        nodePositions.set(id, {
          x: layer.length === 1 ? W / 2 : padX + ni * gapX,
          y: layers.length === 1 ? H / 2 : padY + li * gapY,
        });
      });
    });

    // Edges
    edges.forEach((e) => {
      const s = nodePositions.get(e.source);
      const t = nodePositions.get(e.target);
      if (!s || !t) return;
      svg.append("line")
        .attr("x1", s.x).attr("y1", s.y)
        .attr("x2", t.x).attr("y2", t.y)
        .attr("stroke", "#333")
        .attr("stroke-width", 1);
    });

    // Nodes
    nodePositions.forEach((pos, id) => {
      const node = nodeMap.get(id);
      if (!node) return;
      const config = NODE_CONFIG[node.type];
      const isSelected = id === selectedNodeId;
      const r = isSelected ? 8 : 6;

      svg.append("circle")
        .attr("cx", pos.x)
        .attr("cy", pos.y)
        .attr("r", r)
        .attr("fill", isSelected ? config.color : `${config.color}66`)
        .attr("stroke", isSelected ? "#fff" : config.color)
        .attr("stroke-width", isSelected ? 2 : 1)
        .attr("cursor", "pointer")
        .on("click", () => onNodeSelect(id));
    });
  }, [nodes, edges, selectedNodeId, onNodeSelect]);

  if (nodes.length === 0) return null;

  return (
    <div className="absolute bottom-4 right-4 rounded-lg overflow-hidden border border-[#333] bg-[#111]/90 backdrop-blur-sm">
      <div className="px-3 py-1.5 border-b border-[#333] flex items-center gap-2">
        <span className="text-[10px] font-mono tracking-wider text-[#888] uppercase">Minimap</span>
      </div>
      <svg ref={svgRef} width={W} height={H} />
    </div>
  );
}
