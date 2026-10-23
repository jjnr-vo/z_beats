import { trackFormatFixtures } from "@/utils/track-format";

export type PlaybackFixtureId = (typeof trackFormatFixtures)[number];
export type PlaybackAccess = {
  url: string;
  expiresAt: string;
};

export function isPlaybackFixtureId(value: unknown): value is PlaybackFixtureId {
  return trackFormatFixtures.some((fixture) => fixture === value);
}

export function isPlaybackAccess(value: unknown): value is PlaybackAccess {
  if (!value || typeof value !== "object") return false;
  if (!("url" in value) || typeof value.url !== "string") return false;
  if (!("expiresAt" in value) || typeof value.expiresAt !== "string") return false;

  try {
    return new URL(value.url).protocol === "https:" && Number.isFinite(Date.parse(value.expiresAt));
  } catch {
    return false;
  }
}
