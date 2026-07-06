import { type Agent, type AgentInputItem, run } from "@openai/agents";
import { createAiTwinAgent } from "@/lib/chat/agents/ai-twin";
import { guardrailFallbackAgent } from "@/lib/chat/agents/guardrail-fallback";
import { topicFilterAgent } from "@/lib/chat/agents/topic-filter";
import { topicModeratorAgent } from "@/lib/chat/agents/topic-moderator";
import { runAndApplyGuardrails } from "@/lib/chat/guardrails-config";
import {
  type ConversationTone,
  isAllowedOpener,
} from "@/lib/chat/message-utils";

export type WorkflowAgentResult = {
  agent: Agent;
  agentInput: AgentInputItem[] | string;
};

function isUserMessageItem(
  item: AgentInputItem,
): item is Extract<AgentInputItem, { role: "user" }> {
  return "role" in item && item.role === "user";
}

function applySafeTextToHistory(
  history: AgentInputItem[],
  safeText: string,
): AgentInputItem[] {
  if (!safeText) return history;

  const updated = structuredClone(history);
  for (let i = updated.length - 1; i >= 0; i--) {
    const item = updated[i];
    if (!isUserMessageItem(item) || !Array.isArray(item.content)) continue;

    for (const part of item.content) {
      if (
        part &&
        typeof part === "object" &&
        "type" in part &&
        part.type === "input_text" &&
        "text" in part &&
        typeof part.text === "string"
      ) {
        part.text = safeText;
        return updated;
      }
    }
  }

  return updated;
}

export async function resolvePortfolioWorkflow(
  userText: string,
  portfolioContext: string,
  tone: ConversationTone,
  conversationHistory?: AgentInputItem[],
): Promise<WorkflowAgentResult> {
  const history: AgentInputItem[] = conversationHistory ?? [
    {
      role: "user",
      content: [{ type: "input_text", text: userText }],
    },
  ];

  const skipTopicFilter = isAllowedOpener(userText);
  let verdict: "engage" | "redirect" | "block" = "engage";

  if (!skipTopicFilter) {
    const topicFilterResult = await run(topicFilterAgent, history);
    // Fail open: let the twin handle ambiguous cases rather than hard-blocking
    verdict = topicFilterResult.finalOutput?.verdict ?? "engage";
  }

  if (verdict === "block") {
    return { agent: topicModeratorAgent, agentInput: history };
  }

  const { hasTripwire, safeText } = await runAndApplyGuardrails(userText);
  const scrubbedHistory = applySafeTextToHistory(history, safeText);

  if (hasTripwire) {
    return { agent: guardrailFallbackAgent, agentInput: scrubbedHistory };
  }

  return {
    agent: createAiTwinAgent(
      portfolioContext,
      tone,
      verdict === "redirect" ? "redirect" : "answer",
    ),
    agentInput: scrubbedHistory,
  };
}
