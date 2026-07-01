import { run } from "@openai/agents";
import {
  agents,
  ChatKitServer,
  type AssistantMessageItem,
  type ThreadItemDoneEvent,
  type ThreadMetadata,
  type ThreadStreamEvent,
  type UserMessageItem,
} from "chatkit-node-backend-sdk";
import { checkChatRateLimit } from "@/lib/chat/rate-limit";
import { InMemoryChatStore } from "@/lib/chat/in-memory-store";
import {
  extractUserMessageText,
  parseConversationTone,
} from "@/lib/chat/message-utils";
import { getPortfolioContextText } from "@/lib/chat/portfolio-context";
import { resolvePortfolioWorkflow } from "@/lib/chat/run-workflow";

export type ChatKitRequestContext = {
  userId: string; // guest_<uuid> — used by the store
  guestId: string; // raw cookie value — used for rate limiting
  clientIp: string;
};

export class PortfolioChatKitServer extends ChatKitServer<ChatKitRequestContext> {
  async *respond(
    thread: ThreadMetadata,
    inputUserMessage: UserMessageItem | null,
    context: ChatKitRequestContext,
  ): AsyncGenerator<ThreadStreamEvent> {
    if (!inputUserMessage) return;

    // Only runs when the user sends a message — not on threads.list, etc.
    const rateLimit = await checkChatRateLimit(
      context.guestId,
      context.clientIp,
    );
    if (!rateLimit.success) {
      const minutes = Math.ceil(rateLimit.retryAfterSeconds / 60);

      yield {
        type: "thread.item.done",
        item: {
          id: this.store.generateItemId("message", thread, context),
          thread_id: thread.id,
          created_at: new Date().toISOString(),
          type: "assistant_message",
          content: [
            {
              type: "output_text",
              text: `You've reached the message limit for now. Please try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`,
              annotations: [],
            },
          ],
        } satisfies AssistantMessageItem,
      } satisfies ThreadItemDoneEvent;
      
      return;
    }

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
        userText.length > 48
          ? `${userText.slice(0, 48).trim()}…`
          : userText || "Chat";
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
