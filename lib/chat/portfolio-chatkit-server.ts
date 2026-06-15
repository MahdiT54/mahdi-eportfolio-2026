import { run } from "@openai/agents";
import {
  agents,
  ChatKitServer,
  type ThreadMetadata,
  type ThreadStreamEvent,
  type UserMessageItem,
} from "chatkit-node-backend-sdk";
import { InMemoryChatStore } from "@/lib/chat/in-memory-store";
import {
  extractUserMessageText,
  parseConversationTone,
} from "@/lib/chat/message-utils";
import { getPortfolioContextText } from "@/lib/chat/portfolio-context";
import { resolvePortfolioWorkflow } from "@/lib/chat/run-workflow";

export type ChatKitRequestContext = {
  userId: string;
};

export class PortfolioChatKitServer extends ChatKitServer<ChatKitRequestContext> {
  async *respond(
    thread: ThreadMetadata,
    inputUserMessage: UserMessageItem | null,
    context: ChatKitRequestContext,
  ): AsyncGenerator<ThreadStreamEvent> {
    if (!inputUserMessage) return;

    const userText = extractUserMessageText(inputUserMessage.content);
    const tone = parseConversationTone(
      inputUserMessage.inference_options?.model,
    );
    const portfolioContext = await getPortfolioContextText();
    const agentInput = await agents.simpleToAgentInput(inputUserMessage);
    const { agent, agentInput: workflowInput } = await resolvePortfolioWorkflow(
      userText,
      portfolioContext,
      tone,
      Array.isArray(agentInput) ? agentInput : undefined,
    );

    const agentContext = agents.createAgentContext(thread, this.store, context);

    const runnerStream = await run(agent, workflowInput, {
      stream: true,
      context: agentContext,
    });

    for await (const event of agents.streamAgentResponse(
      agentContext,
      runnerStream,
    )) {
      yield event;
    }

    if (!thread.title) {
      thread.title =
        userText.length > 48 ? `${userText.slice(0, 48).trim()}…` : userText || "Chat";
      await this.store.saveThread(thread, context);
    }
  }
}

const globalForChatKit = globalThis as typeof globalThis & {
  __portfolioChatKitServer?: PortfolioChatKitServer;
};

export function getPortfolioChatKitServer(): PortfolioChatKitServer {
  if (!globalForChatKit.__portfolioChatKitServer) {
    globalForChatKit.__portfolioChatKitServer = new PortfolioChatKitServer(
      new InMemoryChatStore(),
    );
  }
  return globalForChatKit.__portfolioChatKitServer;
}
