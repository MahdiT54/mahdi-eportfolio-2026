import {
  type Attachment,
  type Page,
  Store,
  StoreNotFoundError,
  type ThreadItem,
  type ThreadMetadata,
} from "chatkit-node-backend-sdk";

type StoreBucket = {
  threads: Map<string, ThreadMetadata>;
  items: Map<string, ThreadItem[]>;
  attachments: Map<string, Attachment>;
};

function getBucket(context: unknown): StoreBucket {
  const key = typeof context === "object" && context && "userId" in context
    ? String((context as { userId: string }).userId)
    : "anonymous";

  const globalStore = globalThis as typeof globalThis & {
    __chatkitStoreBuckets?: Map<string, StoreBucket>;
  };

  if (!globalStore.__chatkitStoreBuckets) {
    globalStore.__chatkitStoreBuckets = new Map();
  }

  let bucket = globalStore.__chatkitStoreBuckets.get(key);
  if (!bucket) {
    bucket = {
      threads: new Map(),
      items: new Map(),
      attachments: new Map(),
    };
    globalStore.__chatkitStoreBuckets.set(key, bucket);
  }

  return bucket;
}

export class InMemoryChatStore extends Store<{ userId: string }> {
  private bucket(context: { userId: string }) {
    return getBucket(context);
  }

  async loadThread(
    threadId: string,
    context: { userId: string },
  ): Promise<ThreadMetadata> {
    const thread = this.bucket(context).threads.get(threadId);
    if (!thread) {
      throw new StoreNotFoundError(`Thread ${threadId} not found`);
    }
    return thread;
  }

  async saveThread(
    thread: ThreadMetadata,
    context: { userId: string },
  ): Promise<void> {
    this.bucket(context).threads.set(thread.id, thread);
  }

  async deleteThread(
    threadId: string,
    context: { userId: string },
  ): Promise<void> {
    const bucket = this.bucket(context);
    bucket.threads.delete(threadId);
    bucket.items.delete(threadId);
  }

  async loadThreads(
    limit: number,
    after: string | null,
    order: "asc" | "desc",
    context: { userId: string },
  ): Promise<Page<ThreadMetadata>> {
    const threads = [...this.bucket(context).threads.values()].sort((a, b) => {
      const cmp = a.created_at.localeCompare(b.created_at);
      return order === "asc" ? cmp : -cmp;
    });

    let startIndex = 0;
    if (after) {
      const afterIndex = threads.findIndex((thread) => thread.id === after);
      startIndex = afterIndex >= 0 ? afterIndex + 1 : 0;
    }

    const data = threads.slice(startIndex, startIndex + limit);
    return {
      data,
      has_more: startIndex + limit < threads.length,
      after: data.at(-1)?.id ?? null,
    };
  }

  async loadThreadItems(
    threadId: string,
    after: string | null,
    limit: number,
    order: "asc" | "desc",
    context: { userId: string },
  ): Promise<Page<ThreadItem>> {
    const items = [...(this.bucket(context).items.get(threadId) ?? [])].sort(
      (a, b) => {
        const cmp = a.created_at.localeCompare(b.created_at);
        return order === "asc" ? cmp : -cmp;
      },
    );

    let startIndex = 0;
    if (after) {
      const afterIndex = items.findIndex((item) => item.id === after);
      startIndex = afterIndex >= 0 ? afterIndex + 1 : 0;
    }

    const data = items.slice(startIndex, startIndex + limit);
    return {
      data,
      has_more: startIndex + limit < items.length,
      after: data.at(-1)?.id ?? null,
    };
  }

  async addThreadItem(
    threadId: string,
    item: ThreadItem,
    context: { userId: string },
  ): Promise<void> {
    const bucket = this.bucket(context);
    const items = bucket.items.get(threadId) ?? [];
    items.push(item);
    bucket.items.set(threadId, items);
  }

  async saveItem(
    threadId: string,
    item: ThreadItem,
    context: { userId: string },
  ): Promise<void> {
    const bucket = this.bucket(context);
    const items = bucket.items.get(threadId) ?? [];
    const index = items.findIndex((existing) => existing.id === item.id);
    if (index >= 0) {
      items[index] = item;
    } else {
      items.push(item);
    }
    bucket.items.set(threadId, items);
  }

  async loadItem(
    threadId: string,
    itemId: string,
    context: { userId: string },
  ): Promise<ThreadItem> {
    const item = (this.bucket(context).items.get(threadId) ?? []).find(
      (entry) => entry.id === itemId,
    );
    if (!item) {
      throw new StoreNotFoundError(`Item ${itemId} not found`);
    }
    return item;
  }

  async deleteThreadItem(
    threadId: string,
    itemId: string,
    context: { userId: string },
  ): Promise<void> {
    const bucket = this.bucket(context);
    const items = bucket.items.get(threadId) ?? [];
    bucket.items.set(
      threadId,
      items.filter((item) => item.id !== itemId),
    );
  }

  async saveAttachment(
    attachment: Attachment,
    context: { userId: string },
  ): Promise<void> {
    this.bucket(context).attachments.set(attachment.id, attachment);
  }

  async loadAttachment(
    attachmentId: string,
    context: { userId: string },
  ): Promise<Attachment> {
    const attachment = this.bucket(context).attachments.get(attachmentId);
    if (!attachment) {
      throw new StoreNotFoundError(`Attachment ${attachmentId} not found`);
    }
    return attachment;
  }

  async deleteAttachment(
    attachmentId: string,
    context: { userId: string },
  ): Promise<void> {
    this.bucket(context).attachments.delete(attachmentId);
  }
}
