import { auth } from "@clerk/nextjs/server";
import { getPortfolioChatKitServer } from "@/lib/chat/portfolio-chatkit-server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      { error: "OPENAI_API_KEY not configured" },
      { status: 500 },
    );
  }

  const body = await request.text();
  const server = getPortfolioChatKitServer();
  const result = await server.process(body, { userId });

  if (result.isStreaming) {
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of result) {
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  }

  return Response.json(result.toJSON());
}
