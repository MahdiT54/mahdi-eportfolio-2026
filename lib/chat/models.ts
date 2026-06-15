export const HELPER_MODEL =
  process.env.HELPER_MODEL?.trim() ||
  process.env.CHAT_MODEL?.trim() ||
  "gpt-4.1-mini";

export const CHAT_MODEL = process.env.CHAT_MODEL?.trim() || "gpt-4.1-mini";
