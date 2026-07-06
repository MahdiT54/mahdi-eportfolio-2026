export function extractUserMessageText(
  content: Array<{ type: string; text?: string }>,
): string {
  return content
    .filter((part) => part.type === "input_text" && part.text)
    .map((part) => part.text)
    .join("\n")
    .trim();
}

export type ConversationTone = "crisp" | "clear" | "chatty";

export function parseConversationTone(
  model?: string | null,
): ConversationTone {
  if (model === "crisp" || model === "chatty") return model;
  return "clear";
}

const OPENER_PATTERN =
  /^(hi|hello|hey|yo|sup|howdy|good\s+(morning|afternoon|evening)|what'?s\s+up|nice\s+(site|portfolio|work)|this\s+is\s+(cool|awesome|great|nice))[!.?\s]*$/i;

/** Short greetings and openers that should reach the AI twin, not the topic moderator. */
export function isAllowedOpener(text: string): boolean {
  return OPENER_PATTERN.test(text.trim());
}
