import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT, buildUserMessage } from "@/lib/prompts";
import { AnalysisResult } from "@/lib/types";

export const maxDuration = 300;

const ANALYZE_CODE_TOOL: Anthropic.Tool = {
  name: "analyze_code",
  description: "Decompose code into a structured visual graph with nodes, edges, and concept cards.",
  input_schema: {
    type: "object" as const,
    required: ["language", "explanation", "nodes", "edges", "concepts", "critiques"],
    properties: {
      code: { type: "string", description: "Only include if you generated or modified the code. Omit if analyzing user-submitted code as-is." },
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
              items: {
                type: "object",
                required: ["text", "confidence"],
                properties: {
                  text: { type: "string" },
                  confidence: { type: "string", enum: ["high", "medium", "low"] },
                  reason: { type: "string" },
                  alternative: { type: "string" },
                },
              },
            },
            decision: {
              type: "object",
              required: ["chose", "because", "alternatives"],
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
      concepts: {
        type: "array",
        description: "Generate 1 to 3 concept cards. Maximum 3.",
        maxItems: 3,
        items: {
          type: "object",
          required: ["id", "title", "principle", "relevance", "difficulty"],
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            principle: { type: "string" },
            relevance: { type: "string" },
            difficulty: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
            nodeId: { type: "string" },
          },
        },
      },
      critiques: {
        type: "array",
        description: "Generate exactly 2 alternatives. No more.",
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
            codeExample: { type: "string", description: "Optional. 5–8 lines maximum. Omit if not needed." },
          },
        },
      },
    },
  },
};

export async function POST(req: NextRequest) {
  const { message } = await req.json();

  if (!message || typeof message !== "string") {
    return new Response(
      `data: ${JSON.stringify({ error: "Message is required" })}\n\n`,
      { status: 400, headers: { "Content-Type": "text/event-stream" } }
    );
  }

  const client = new Anthropic();
  const encoder = new TextEncoder();

  const body = new ReadableStream({
    async start(controller) {
      const send = (text: string) => controller.enqueue(encoder.encode(text));

      const heartbeat = setInterval(() => send(": heartbeat\n\n"), 15000);

      try {
        const stream = client.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 4096,
          system: SYSTEM_PROMPT,
          tools: [ANALYZE_CODE_TOOL],
          tool_choice: { type: "tool", name: "analyze_code" },
          messages: [{ role: "user", content: buildUserMessage(message) }],
        });
        const response = await stream.finalMessage();
        clearInterval(heartbeat);

        const toolBlock = response.content.find((b) => b.type === "tool_use");
        if (!toolBlock || toolBlock.type !== "tool_use") {
          send(`data: ${JSON.stringify({ error: "No structured output returned from API" })}\n\n`);
          return;
        }

        const analysis = toolBlock.input as AnalysisResult;
        if (!analysis.code) analysis.code = message;

        if (!analysis.nodes || !analysis.edges) {
          send(`data: ${JSON.stringify({ error: "Incomplete analysis result" })}\n\n`);
          return;
        }

        send(`data: ${JSON.stringify({ analysis })}\n\n`);
      } catch (error) {
        clearInterval(heartbeat);
        console.error("Analysis error:", error instanceof Error ? error.message : error);
        const isTimeout =
          error instanceof Error &&
          (error.message.includes("timeout") ||
            error.message.includes("timed out") ||
            (error as { status?: number }).status === 408);
        send(`data: ${JSON.stringify({
          error: isTimeout
            ? "Analysis timed out — please try again with a shorter snippet."
            : "Analysis failed. Please paste your code again.",
        })}\n\n`);
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
