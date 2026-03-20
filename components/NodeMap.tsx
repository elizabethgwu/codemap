"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import * as d3 from "d3";
import { CodeNode, CodeEdge, NODE_CONFIG, NodeType } from "@/lib/types";

interface NodeMapProps {
  nodes: CodeNode[];
  edges: CodeEdge[];
  selectedNodeId: string | null;
  onNodeSelect: (nodeId: string | null) => void;
  width?: number;
  height?: number;
}

interface LayoutNode extends CodeNode {
  x: number;
  y: number;
}

function computeLayout(nodes: CodeNode[], edges: CodeEdge[], width: number, height: number): LayoutNode[] {
  // Topological sort for vertical layout
  const adj = new Map<string, string[]>();
  const inDeg = new Map<string, number>();
  nodes.forEach((n) => {
    adj.set(n.id, []);
    inDeg.set(n.id, 0);
  });
  edges.forEach((e) => {
    adj.get(e.source)?.push(e.target);
    inDeg.set(e.target, (inDeg.get(e.target) || 0) + 1);
  });

  // BFS layers
  const layers: string[][] = [];
  let queue = nodes.filter((n) => (inDeg.get(n.id) || 0) === 0).map((n) => n.id);
  const visited = new Set<string>();

  while (queue.length > 0) {
    layers.push([...queue]);
    queue.forEach((id) => visited.add(id));
    const next: string[] = [];
    queue.forEach((id) => {
      (adj.get(id) || []).forEach((target) => {
        if (!visited.has(target)) {
          inDeg.set(target, (inDeg.get(target) || 0) - 1);
          if (inDeg.get(target) === 0) next.push(target);
        }
      });
    });
    queue = next;
  }

  // Place any unvisited nodes
  nodes.forEach((n) => {
    if (!visited.has(n.id)) {
      layers.push([n.id]);
      visited.add(n.id);
    }
  });

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const paddingX = 100;
  const paddingY = 80;
  const usableW = width - paddingX * 2;
  const usableH = height - paddingY * 2;
  const layerGap = layers.length > 1 ? usableH / (layers.length - 1) : 0;

  const layoutNodes: LayoutNode[] = [];

  layers.forEach((layer, li) => {
    const nodeGap = layer.length > 1 ? usableW / (layer.length - 1) : 0;
    layer.forEach((id, ni) => {
      const node = nodeMap.get(id);
      if (!node) return;
      layoutNodes.push({
        ...node,
        x: layer.length === 1 ? width / 2 : paddingX + ni * nodeGap,
        y: layers.length === 1 ? height / 2 : paddingY + li * layerGap,
      });
    });
  });

  return layoutNodes;
}

function drawNodeShape(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  type: NodeType,
  size: number,
  isSelected: boolean
) {
  const config = NODE_CONFIG[type];
  const stroke = isSelected ? "#fff" : config.color;
  const strokeW = isSelected ? 3 : 2;
  const fill = isSelected ? config.color : `${config.color}22`;

  g.selectAll("*").remove();

  switch (config.shape) {
    case "hexagon": {
      const r = size;
      const points = Array.from({ length: 6 }, (_, i) => {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        return `${r * Math.cos(angle)},${r * Math.sin(angle)}`;
      }).join(" ");
      g.append("polygon")
        .attr("points", points)
        .attr("fill", fill)
        .attr("stroke", stroke)
        .attr("stroke-width", strokeW);
      break;
    }
    case "rectangle":
      g.append("rect")
        .attr("x", -size)
        .attr("y", -size * 0.7)
        .attr("width", size * 2)
        .attr("height", size * 1.4)
        .attr("rx", 4)
        .attr("fill", fill)
        .attr("stroke", stroke)
        .attr("stroke-width", strokeW);
      break;
    case "diamond": {
      const s = size;
      g.append("polygon")
        .attr("points", `0,${-s} ${s},0 0,${s} ${-s},0`)
        .attr("fill", fill)
        .attr("stroke", stroke)
        .attr("stroke-width", strokeW);
      break;
    }
    case "rounded-rect":
      g.append("rect")
        .attr("x", -size)
        .attr("y", -size * 0.7)
        .attr("width", size * 2)
        .attr("height", size * 1.4)
        .attr("rx", size * 0.35)
        .attr("fill", fill)
        .attr("stroke", stroke)
        .attr("stroke-width", strokeW);
      break;
  }

  // Icon
  g.append("text")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "central")
    .attr("y", -2)
    .attr("font-size", 16)
    .attr("fill", isSelected ? "#fff" : config.color)
    .attr("pointer-events", "none")
    .text(config.icon);

  // Type label
  g.append("text")
    .attr("text-anchor", "middle")
    .attr("y", size + 18)
    .attr("font-size", 9)
    .attr("font-family", "monospace")
    .attr("letter-spacing", "0.1em")
    .attr("fill", config.color)
    .attr("opacity", 0.7)
    .attr("pointer-events", "none")
    .text(config.label);
}

export default function NodeMap({
  nodes,
  edges,
  selectedNodeId,
  onNodeSelect,
  width = 600,
  height = 500,
}: NodeMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [layoutNodes, setLayoutNodes] = useState<LayoutNode[]>([]);

  useEffect(() => {
    if (nodes.length === 0) return;
    setLayoutNodes(computeLayout(nodes, edges, width, height));
  }, [nodes, edges, width, height]);

  useEffect(() => {
    if (!svgRef.current || layoutNodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const defs = svg.append("defs");

    // Arrow markers for edges
    defs
      .append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 0 10 7")
      .attr("refX", 10)
      .attr("refY", 3.5)
      .attr("markerWidth", 8)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("polygon")
      .attr("points", "0 0, 10 3.5, 0 7")
      .attr("fill", "#555");

    // Glow filter for selected nodes
    const filter = defs.append("filter").attr("id", "glow");
    filter
      .append("feGaussianBlur")
      .attr("stdDeviation", "4")
      .attr("result", "coloredBlur");
    const merge = filter.append("feMerge");
    merge.append("feMergeNode").attr("in", "coloredBlur");
    merge.append("feMergeNode").attr("in", "SourceGraphic");

    const g = svg.append("g");

    // Zoom
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform.toString());
      });
    svg.call(zoom);

    const nodeMap = new Map(layoutNodes.map((n) => [n.id, n]));

    // Draw edges
    edges.forEach((edge) => {
      const source = nodeMap.get(edge.source);
      const target = nodeMap.get(edge.target);
      if (!source || !target) return;

      const midY = (source.y + target.y) / 2;

      g.append("path")
        .attr(
          "d",
          `M ${source.x} ${source.y} C ${source.x} ${midY}, ${target.x} ${midY}, ${target.x} ${target.y}`
        )
        .attr("fill", "none")
        .attr("stroke", "#444")
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "6,3")
        .attr("marker-end", "url(#arrowhead)")
        .attr("opacity", 0.6);

      if (edge.label) {
        g.append("text")
          .attr("x", (source.x + target.x) / 2)
          .attr("y", midY - 8)
          .attr("text-anchor", "middle")
          .attr("font-size", 10)
          .attr("fill", "#888")
          .attr("font-family", "monospace")
          .text(edge.label);
      }
    });

    // Draw nodes
    layoutNodes.forEach((node) => {
      const isSelected = node.id === selectedNodeId;
      const nodeG = g
        .append("g")
        .attr("transform", `translate(${node.x}, ${node.y})`)
        .attr("cursor", "pointer")
        .attr("class", "map-node")
        .on("click", (event) => {
          event.stopPropagation();
          onNodeSelect(isSelected ? null : node.id);
        });

      if (isSelected) {
        nodeG.attr("filter", "url(#glow)");
      }

      const size = 32;
      drawNodeShape(nodeG, node.type, size, isSelected);

      // Node label below shape
      nodeG
        .append("text")
        .attr("text-anchor", "middle")
        .attr("y", size + 32)
        .attr("font-size", 12)
        .attr("font-weight", 600)
        .attr("fill", isSelected ? "#fff" : "#ccc")
        .attr("pointer-events", "none")
        .text(node.label.length > 20 ? node.label.slice(0, 18) + "…" : node.label);

      // Hover effect
      nodeG
        .on("mouseenter", function () {
          d3.select(this).select("polygon, rect").attr("stroke-width", 3);
        })
        .on("mouseleave", function () {
          if (!isSelected) {
            d3.select(this).select("polygon, rect").attr("stroke-width", 2);
          }
        });
    });

    // Click background to deselect
    svg.on("click", () => onNodeSelect(null));
  }, [layoutNodes, edges, selectedNodeId, onNodeSelect]);

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="bg-transparent"
    />
  );
}
