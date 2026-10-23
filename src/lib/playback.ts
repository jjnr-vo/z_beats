export const playbackFixtures = [
  { id: "mp3", label: "MP3 sample" },
  { id: "wav", label: "WAV sample" },
  { id: "aac", label: "AAC sample" },
  { id: "m4a", label: "M4A sample" },
  { id: "long", label: "Long track" },
  { id: "special", label: "Special-character path" },
] as const;

export type PlaybackFixtureId = (typeof playbackFixtures)[number]["id"];

export type PlaybackAccess = {
  url: string;
  expiresAt: string;
};

export function isPlaybackFixtureId(value: unknown): value is PlaybackFixtureId {
  return playbackFixtures.some((fixture) => fixture.id === value);
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
