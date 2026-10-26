export type PlaybackAccess = {
  url: string;
  expiresAt: string;
};

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
