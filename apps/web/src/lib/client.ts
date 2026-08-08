import { createClient } from "@zoku/client";
import { formatClientError } from "@zoku/core/api-error";

export const client = createClient({ baseUrl: "" });

export function formatError(error: unknown): string {
  return formatClientError(error);
}
