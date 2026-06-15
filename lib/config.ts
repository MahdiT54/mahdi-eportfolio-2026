import type {
  ColorScheme,
  StartScreenPrompt,
  ThemeOption,
} from "@openai/chatkit-react";

export const CHATKIT_API_URL =
  process.env.NEXT_PUBLIC_CHATKIT_API_URL?.trim() || "/api/chatkit";

export const CHATKIT_DOMAIN_KEY =
  process.env.NEXT_PUBLIC_CHATKIT_DOMAIN_KEY?.trim() ||
  "domain_pk_localhost_dev";

/** @deprecated Agent Builder workflow — no longer used after Agents SDK migration */
export const WORKFLOW_ID =
  process.env.NEXT_PUBLIC_CHATKIT_WORKFLOW_ID?.trim() ?? "";

export const STARTER_PROMPTS: StartScreenPrompt[] = [
  {
    label: "What can you do?",
    prompt: "What can you do?",
    icon: "circle-question",
  },
];

export const PLACEHOLDER_INPUT = "Ask anything...";

export const GREETING = "How can I help you today?";

export const getThemeConfig = (theme: ColorScheme): ThemeOption => ({
  color: {
    grayscale: {
      hue: 220,
      tint: 6,
      shade: theme === "dark" ? -1 : -4,
    },
    accent: {
      primary: theme === "dark" ? "#f1f5f9" : "#0f172a",
      level: 1,
    },
  },
  radius: "round",
});
