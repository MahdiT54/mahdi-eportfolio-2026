import assert from "node:assert/strict";
import { test } from "node:test";
import { Agent, run } from "@openai/agents";
import { agents, Store } from "chatkit-node-backend-sdk";

test("ChatKit completes when token usage contains nested cache details", async () => {
  const text = "I want to build useful web apps.";
  const message = {
    id: "msg_regression",
    type: "message",
    role: "assistant",
    status: "completed",
    content: [{ type: "output_text", text, annotations: [] }],
  };
  const inputTokensDetails = {
    cached_tokens: 0,
    cache_write_tokens_details: { ephemeral_5m_input_tokens: 0 },
  };
  const tokenCounts = { inputTokens: 10, outputTokens: 8, totalTokens: 18 };
  const model = {
    async *getStreamedResponse() {
      yield {
        type: "model",
        event: { type: "response.output_item.added", item: message },
      };
      yield {
        type: "model",
        event: { type: "response.output_item.done", item: message },
      };
      // This final metadata event used to fail after the answer was displayed.
      yield {
        type: "response_done",
        response: {
          id: "resp_regression",
          output: [message],
          usage: {
            ...tokenCounts,
            inputTokensDetails,
            requestUsageEntries: [{ ...tokenCounts, inputTokensDetails }],
          },
        },
      };
    },
  };
  class TestStore extends Store {
    async addThreadItem() {}
  }
  const context = agents.createAgentContext(
    {
      id: "thread_regression",
      created_at: new Date().toISOString(),
      metadata: {},
    },
    new TestStore(),
    {},
  );
  const stream = await run(
    new Agent({ name: "Regression", model }),
    "Aspirations?",
    {
      stream: true,
      context,
      tracingDisabled: true,
    },
  );
  const events = [];
  for await (const event of agents.streamAgentResponse(context, stream)) {
    events.push(event);
  }
  assert.deepEqual(
    events.filter((event) => event.type === "error"),
    [],
  );
  const done = events.find((event) => event.type === "thread.item.done");
  assert.equal(done?.item.content[0].text, text);
  assert.equal(stream.finalOutput, text);
});
