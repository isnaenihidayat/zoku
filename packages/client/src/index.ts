export { ZokuClient } from "./client";
export type {
  RemoteChatSession,
  SendMessageArg,
  SendStreamOptions,
  StreamHandler,
  StreamHandlers,
  ZokuClientOptions,
} from "./types";
export { formatClientError as formatError, ZokuApiError } from "@zoku/core/api-error";

import type { ProfileSummary } from "@zoku/core/contract";
import { ZokuClient } from "./client";
import type { ZokuClientOptions } from "./types";

export function createClient(options?: ZokuClientOptions): ZokuClient {
  return new ZokuClient(options);
}

export function getProfileAvatarUrl(
  profile: Pick<ProfileSummary, "id" | "hasAvatar" | "updatedAt">,
): string | null {
  if (!profile.hasAvatar) {
    return null;
  }

  const query = new URLSearchParams({ v: profile.updatedAt });
  return `/v1/profiles/${encodeURIComponent(profile.id)}/avatar?${query.toString()}`;
}
