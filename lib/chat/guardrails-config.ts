import { runGuardrails, type GuardrailResult } from "@openai/guardrails";
import { OpenAI } from "openai";

export const guardrailsConfig = {
  guardrails: [
    {
      name: "Contains PII",
      config: {
        block: false,
        detect_encoded_pii: true,
        entities: [
          "AU_ABN",
          "AU_ACN",
          "AU_MEDICARE",
          "AU_TFN",
          "CREDIT_CARD",
          "CRYPTO",
          "DATE_TIME",
          "ES_NIE",
          "ES_NIF",
          "FI_PERSONAL_IDENTITY_CODE",
          "IBAN_CODE",
          "IN_AADHAAR",
          "IN_PAN",
          "IN_PASSPORT",
          "IN_VEHICLE_REGISTRATION",
          "IN_VOTER",
          "IP_ADDRESS",
          "IT_DRIVER_LICENSE",
          "IT_FISCAL_CODE",
          "IT_IDENTITY_CARD",
          "IT_PASSPORT",
          "IT_VAT_CODE",
          "KR_RRN",
          "LOCATION",
          "MEDICAL_LICENSE",
          "NRP",
          "PL_PESEL",
          "SG_NRIC_FIN",
          "SG_UEN",
          "UK_NHS",
          "UK_NINO",
          "URL",
          "US_BANK_NUMBER",
          "US_DRIVER_LICENSE",
          "US_ITIN",
          "US_PASSPORT",
          "US_SSN",
        ],
      },
    },
    {
      name: "Moderation",
      config: {
        categories: [
          "sexual",
          "sexual/minors",
          "hate",
          "hate/threatening",
          "harassment",
          "harassment/threatening",
          "self-harm",
          "self-harm/intent",
          "self-harm/instructions",
          "violence",
          "violence/graphic",
          "illicit",
          "illicit/violent",
        ],
      },
    },
    {
      name: "Jailbreak",
      config: { model: "gpt-4.1-mini", confidence_threshold: 0.7 },
    },
  ],
};

const guardrailContext = {
  guardrailLlm: new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
};

function guardrailsHasTripwire(results: GuardrailResult[]): boolean {
  return results.some((r) => r.tripwireTriggered === true);
}

function getGuardrailSafeText(
  results: GuardrailResult[],
  fallbackText: string,
): string {
  for (const r of results) {
    if (r.info && "checked_text" in r.info) {
      return (r.info.checked_text as string | undefined) ?? fallbackText;
    }
  }
  const pii = results.find((r) => r.info && "anonymized_text" in r.info);
  return (pii?.info?.anonymized_text as string | undefined) ?? fallbackText;
}

export async function runAndApplyGuardrails(inputText: string) {
  const results = await runGuardrails(
    inputText,
    guardrailsConfig,
    guardrailContext,
    true,
  );
  const hasTripwire = guardrailsHasTripwire(results);
  const safeText = getGuardrailSafeText(results, inputText);

  return { results, hasTripwire, safeText };
}
