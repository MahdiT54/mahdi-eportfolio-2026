import type { Redis } from "@upstash/redis";
import {
  type Attachment,
  type Page,
  Store,
  StoreNotFoundError,
  type ThreadItem,
  type ThreadMetadata,
} from "chatkit-node-backend-sdk";
import { getChatStorePrefix, getRedis } from "@/lib/upstash";

type ChatContext = { userId: string };

function storePrefix(): string {
  return `${getChatStorePrefix()}:chatkit`;
}

function threadsKey(userId: string): string {
  return `${storePrefix()}:user:${userId}:threads`;
}

function threadKey(userId: string, threadId: string): string {
  return `${storePrefix()}:user:${userId}:thread:${threadId}`;
}

function itemsKey(userId: string, threadId: string): string {
  return `${storePrefix()}:user:${userId}:thread:${threadId}:items`;
}

function attachmentKey(userId: string, attachmentId: string): string {
  return `${storePrefix()}:user:${userId}:attachment:${attachmentId}`;
}

function threadScore(thread: ThreadMetadata): number {
  const parsed = Date.parse(thread.created_at);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function paginate<T extends { id: string; created_at: string }>(
  entries: T[],
  after: string | null,
  limit: number,
  order: "asc" | "desc",
): Page<T> {
  const sorted = [...entries].sort((a, b) => {
    const cmp = a.created_at.localeCompare(b.created_at);
    return order === "asc" ? cmp : -cmp;
  });

  let startIndex = 0;
  if (after) {
    const afterIndex = sorted.findIndex((entry) => entry.id === after);
    startIndex = afterIndex >= 0 ? afterIndex + 1 : 0;
  }

  const data = sorted.slice(startIndex, startIndex + limit);
  return {
    data,
    has_more: startIndex + limit < sorted.length,
    after: data.at(-1)?.id ?? null,
  };
}

export class RedisChatStore extends Store<ChatContext> {
  private readonly redis: Redis;

  constructor(redis: Redis = getRedis()) {
    super();
    this.redis = redis;
  }

  async loadThread(threadId: string, context: ChatContext): Promise<ThreadMetadata> {
    const thread = await this.redis.get<ThreadMetadata>(
      threadKey(context.userId, threadId),
    );
    if (!thread) {
      throw new StoreNotFoundError(`Thread ${threadId} not found`);
    }
    return thread;
  }

  async saveThread(thread: ThreadMetadata, context: ChatContext): Promise<void> {
    const key = threadKey(context.userId, thread.id);
    await Promise.all([
      this.redis.set(key, thread),
      this.redis.zadd(threadsKey(context.userId), {
        score: threadScore(thread),
        member: thread.id,
      }),
    ]);
  }

  async deleteThread(threadId: string, context: ChatContext): Promise<void> {
    await Promise.all([
      this.redis.del(threadKey(context.userId, threadId)),
      this.redis.del(itemsKey(context.userId, threadId)),
      this.redis.zrem(threadsKey(context.userId), threadId),
    ]);
  }

  async loadThreads(
    limit: number,
    after: string | null,
    order: "asc" | "desc",
    context: ChatContext,
  ): Promise<Page<ThreadMetadata>> {
    const threadIds =
      order === "asc"
        ? await this.redis.zrange<string[]>(threadsKey(context.userId), 0, -1)
        : await this.redis.zrange<string[]>(
            threadsKey(context.userId),
            0,
            -1,
            { rev: true },
          );

    if (!threadIds.length) {
      return { data: [], has_more: false, after: null };
    }

    const keys = threadIds.map((threadId) =>
      threadKey(context.userId, threadId),
    );
    const threads = (await this.redis.mget<ThreadMetadata[]>(...keys)).filter(
      (thread): thread is ThreadMetadata => thread !== null,
    );

    return paginate(threads, after, limit, order);
  }

  async loadThreadItems(
    threadId: string,
    after: string | null,
    limit: number,
    order: "asc" | "desc",
    context: ChatContext,
  ): Promise<Page<ThreadItem>> {
    const items =
      (await this.redis.get<ThreadItem[]>(itemsKey(context.userId, threadId))) ??
      [];
    return paginate(items, after, limit, order);
  }

  async addThreadItem(
    threadId: string,
    item: ThreadItem,
    context: ChatContext,
  ): Promise<void> {
    const key = itemsKey(context.userId, threadId);
    const items = (await this.redis.get<ThreadItem[]>(key)) ?? [];
    items.push(item);
    await this.redis.set(key, items);
  }

  async saveItem(
    threadId: string,
    item: ThreadItem,
    context: ChatContext,
  ): Promise<void> {
    const key = itemsKey(context.userId, threadId);
    const items = (await this.redis.get<ThreadItem[]>(key)) ?? [];
    const index = items.findIndex((existing) => existing.id === item.id);
    if (index >= 0) {
      items[index] = item;
    } else {
      items.push(item);
    }
    await this.redis.set(key, items);
  }

  async loadItem(
    threadId: string,
    itemId: string,
    context: ChatContext,
  ): Promise<ThreadItem> {
    const items =
      (await this.redis.get<ThreadItem[]>(
        itemsKey(context.userId, threadId),
      )) ?? [];
    const item = items.find((entry) => entry.id === itemId);
    if (!item) {
      throw new StoreNotFoundError(`Item ${itemId} not found`);
    }
    return item;
  }

  async deleteThreadItem(
    threadId: string,
    itemId: string,
    context: ChatContext,
  ): Promise<void> {
    const key = itemsKey(context.userId, threadId);
    const items = (await this.redis.get<ThreadItem[]>(key)) ?? [];
    await this.redis.set(
      key,
      items.filter((item) => item.id !== itemId),
    );
  }

  async saveAttachment(
    attachment: Attachment,
    context: ChatContext,
  ): Promise<void> {
    await this.redis.set(
      attachmentKey(context.userId, attachment.id),
      attachment,
    );
  }

  async loadAttachment(
    attachmentId: string,
    context: ChatContext,
  ): Promise<Attachment> {
    const attachment = await this.redis.get<Attachment>(
      attachmentKey(context.userId, attachmentId),
    );
    if (!attachment) {
      throw new StoreNotFoundError(`Attachment ${attachmentId} not found`);
    }
    return attachment;
  }

  async deleteAttachment(
    attachmentId: string,
    context: ChatContext,
  ): Promise<void> {
    await this.redis.del(attachmentKey(context.userId, attachmentId));
  }
}
