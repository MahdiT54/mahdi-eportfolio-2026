const getEnv = (...keys: string[]) => {
  for (const key of keys) {
    const value = process.env[key];
    if (value !== undefined && value !== "") {
      return value;
    }
  }

  return undefined;
};

const defaultProjectId = "iycipqp6";
const defaultDataset = "develop";

export const apiVersion =
  getEnv("NEXT_PUBLIC_SANITY_API_VERSION", "SANITY_STUDIO_API_VERSION") ||
  "2025-10-15";

export const dataset = assertValue(
  getEnv("NEXT_PUBLIC_SANITY_DATASET", "SANITY_STUDIO_DATASET") ||
    defaultDataset,
  "Missing environment variable: NEXT_PUBLIC_SANITY_DATASET (or SANITY_STUDIO_DATASET), and no default dataset is configured",
);

export const projectId = assertValue(
  getEnv("NEXT_PUBLIC_SANITY_PROJECT_ID", "SANITY_STUDIO_PROJECT_ID") ||
    defaultProjectId,
  "Missing environment variable: NEXT_PUBLIC_SANITY_PROJECT_ID (or SANITY_STUDIO_PROJECT_ID), and no default project ID is configured",
);

function assertValue<T>(v: T | undefined, errorMessage: string): T {
  if (v === undefined) {
    throw new Error(errorMessage);
  }

  return v;
}
