import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  ANALYZE_PAPER_SYSTEM_PROMPT,
  ENRICH_PAPER_SYSTEM_PROMPT,
  buildPaperUserMessage,
  buildPaperEnrichMessage,
} from "@/lib/paper-prompts";
import { AnalysisResult } from "@/lib/types";

export const maxDuration = 300;

const ANALYZE_CODE_TOOL: Anthropic.Tool = {
  name: "analyze_code",
  description: "Decompose an academic paper into a structured visual argument graph with nodes and edges.",
  input_schema: {
    type: "object" as const,
    required: ["language", "explanation", "nodes", "edges"],
    properties: {
      code: {
        type: "string",
        description: "The full paper text formatted as numbered paragraphs: [PARAGRAPH 1]\\ntext\\n\\n[PARAGRAPH 2]\\ntext...",
      },
      language: { type: "string" },
      explanation: { type: "string" },
      nodes: {
        type: "array",
        items: {
          type: "object",
          required: ["id", "type", "label", "description", "codeRange", "variables", "assumptions", "dependencies"],
          properties: {
            id: { type: "string" },
            type: { type: "string", enum: ["scope", "process", "output", "decision"] },
            label: { type: "string" },
            description: { type: "string" },
            codeRange: {
              type: "object",
              required: ["startLine", "endLine"],
              properties: {
                startLine: { type: "integer" },
                endLine: { type: "integer" },
              },
            },
            variables: {
              type: "array",
              items: {
                type: "object",
                required: ["name", "type", "description"],
                properties: {
                  name: { type: "string" },
                  type: { type: "string" },
                  value: { type: "string" },
                  description: { type: "string" },
                },
              },
            },
            assumptions: {
              type: "array",
              maxItems: 1,
              items: {
                type: "object",
                required: ["text", "confidence"],
                properties: {
                  text: { type: "string" },
                  confidence: { type: "string", enum: ["high", "medium", "low"] },
                },
              },
            },
            decision: {
              type: "object",
              required: ["chose", "because"],
              properties: {
                chose: { type: "string" },
                because: { type: "string" },
                alternatives: {
                  type: "array",
                  items: {
                    type: "object",
                    required: ["option", "tradeoff"],
                    properties: {
                      option: { type: "string" },
                      tradeoff: { type: "string" },
                    },
                  },
                },
              },
            },
            dependencies: { type: "array", items: { type: "string" } },
            secondaryNodeIds: {
              type: "array",
              items: { type: "string" },
              description: "Optional. IDs of other nodes that share paragraphs in this range as secondary participants.",
            },
          },
        },
      },
      edges: {
        type: "array",
        items: {
          type: "object",
          required: ["source", "target"],
          properties: {
            source: { type: "string" },
            target: { type: "string" },
            label: { type: "string" },
          },
        },
      },
    },
  },
};

const ENRICH_ANALYSIS_TOOL: Anthropic.Tool = {
  name: "enrich_analysis",
  description: "Add writing craft concept cards and writing tutor feedback to a completed paper analysis.",
  input_schema: {
    type: "object" as const,
    required: ["concepts", "critiques"],
    properties: {
      concepts: {
        type: "array",
        description: "1 to 3 writing craft concept cards. Maximum 3.",
        maxItems: 3,
        items: {
          type: "object",
          required: ["id", "title", "principle", "relevance", "difficulty", "nodeId"],
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            principle: { type: "string" },
            relevance: { type: "string" },
            difficulty: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
            nodeId: { type: "string", description: "ID of the node that best demonstrates this framework" },
          },
        },
      },
      critiques: {
        type: "array",
        description: "1 to 2 writing tutor feedback cards identifying specific problems in the paper.",
        maxItems: 2,
        items: {
          type: "object",
          required: ["id", "title", "summary", "explanation", "tradeoff", "complexity"],
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            summary: { type: "string" },
            explanation: { type: "string" },
            tradeoff: { type: "string" },
            complexity: { type: "string", enum: ["simpler", "similar", "more complex"] },
            codeExample: {
              type: "string",
              description: "Optional. A concrete suggested rewrite (2-6 sentences) showing how to fix the identified problem. Write as revised prose, not code.",
            },
          },
        },
      },
    },
  },
};

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("pdf") as File | null;

  const encoder = new TextEncoder();

  if (!file) {
    return new Response(
      `data: ${JSON.stringify({ error: "No PDF file provided" })}\n\n`,
      { status: 400, headers: { "Content-Type": "text/event-stream" } }
    );
  }

  const MAX_SIZE = 20 * 1024 * 1024; // 20MB
  if (file.size > MAX_SIZE) {
    return new Response(
      `data: ${JSON.stringify({ error: "PDF exceeds 20MB limit. Try a shorter paper." })}\n\n`,
      { status: 400, headers: { "Content-Type": "text/event-stream" } }
    );
  }

  const client = new Anthropic();

  const body = new ReadableStream({
    async start(controller) {
      const send = (text: string) => controller.enqueue(encoder.encode(text));

      const heartbeat = setInterval(() => send(": heartbeat\n\n"), 15000);

      try {
        const bytes = await file.arrayBuffer();
        const base64 = Buffer.from(bytes).toString("base64");

        const documentBlock: Anthropic.DocumentBlockParam = {
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: base64,
          },
        };

        // ── Call 1: core analysis (nodes + edges) ──────────────────────────
        const stream1 = client.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 4096,
          system: ANALYZE_PAPER_SYSTEM_PROMPT,
          tools: [ANALYZE_CODE_TOOL],
          tool_choice: { type: "tool", name: "analyze_code" },
          messages: [
            {
              role: "user",
              content: [
                documentBlock,
                { type: "text", text: buildPaperUserMessage() },
              ],
            },
          ],
        });
        const response1 = await stream1.finalMessage();
        clearInterval(heartbeat);

        const toolBlock1 = response1.content.find((b) => b.type === "tool_use");
        if (!toolBlock1 || toolBlock1.type !== "tool_use") {
          send(`data: ${JSON.stringify({ error: "No structured output returned from API" })}\n\n`);
          return;
        }

        type RawAnalysis = Omit<AnalysisResult, "concepts" | "critiques"> & { code?: string };
        const coreAnalysis = toolBlock1.input as RawAnalysis;

        // Emit the paragraph text so CodePanel can display it
        const paragraphText = coreAnalysis.code ?? "";
        if (paragraphText) {
          send(`data: ${JSON.stringify({ generatedCode: paragraphText })}\n\n`);
          delete coreAnalysis.code;
        }

        if (!coreAnalysis.nodes || !coreAnalysis.edges) {
          console.error("Incomplete paper analysis — stop_reason:", response1.stop_reason);
          send(`data: ${JSON.stringify({ error: "Incomplete analysis result" })}\n\n`);
          return;
        }

        const partialAnalysis: AnalysisResult = {
          ...(coreAnalysis as AnalysisResult),
          concepts: [],
          critiques: [],
        };
        send(`data: ${JSON.stringify({ analysis: partialAnalysis })}\n\n`);

        // ── Call 2: enrichment (concepts + critiques) ──────────────────────
        const heartbeat2 = setInterval(() => send(": heartbeat\n\n"), 15000);
        try {
          const stream2 = client.messages.stream({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 2048,
            system: ENRICH_PAPER_SYSTEM_PROMPT,
            tools: [ENRICH_ANALYSIS_TOOL],
            tool_choice: { type: "tool", name: "enrich_analysis" },
            messages: [
              {
                role: "user",
                content: buildPaperEnrichMessage(paragraphText, coreAnalysis),
              },
            ],
          });
          const response2 = await stream2.finalMessage();

          const toolBlock2 = response2.content.find((b) => b.type === "tool_use");
          if (toolBlock2 && toolBlock2.type === "tool_use") {
            send(`data: ${JSON.stringify({ enrichment: toolBlock2.input })}\n\n`);
          }
        } finally {
          clearInterval(heartbeat2);
        }
      } catch (error) {
        clearInterval(heartbeat);
        console.error("Paper analysis error:", error instanceof Error ? error.message : error);
        const isTimeout =
          error instanceof Error &&
          (error.message.includes("timeout") ||
            error.message.includes("timed out") ||
            (error as { status?: number }).status === 408);
        send(
          `data: ${JSON.stringify({
            error: isTimeout
              ? "PDF analysis timed out — try a shorter paper."
              : "PDF analysis failed. Please check your API key and try again.",
          })}\n\n`
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
