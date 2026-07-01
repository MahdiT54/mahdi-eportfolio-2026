import { Redis } from "@upstash/redis";

const globalForRedis = globalThis as typeof globalThis & {
  __upstashRedis?: Redis;
};

export function getRedis(): Redis {
  if (!globalForRedis.__upstashRedis) {
    globalForRedis.__upstashRedis = Redis.fromEnv();
  }
  return globalForRedis.__upstashRedis;
}

export function getChatStorePrefix(): string {
  return (
    process.env.CHAT_STORE_PREFIX?.trim() ||
    process.env.RATE_LIMIT_PREFIX?.trim() ||
    "chat:dev"
  );
}
