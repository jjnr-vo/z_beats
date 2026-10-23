import { HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createPlaybackAccess, PlaybackObjectNotFoundError } from "./r2";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  send: vi.fn(),
  destroy: vi.fn(),
}));

beforeEach(() => {
  vi.stubEnv("R2_ACCOUNT_ID", "a".repeat(32));
  vi.stubEnv("R2_BUCKET_NAME", "private-music");
  vi.stubEnv("R2_ACCESS_KEY_ID", "test-access");
  vi.stubEnv("R2_SECRET_ACCESS_KEY", "test-secret");
  vi.stubEnv("R2_FIXTURE_MP3_KEY", "library/Special #1 + song.mp3");
  vi.stubEnv("R2_PLAYBACK_TTL_SECONDS", "900");
  mocks.send.mockResolvedValue({});
  vi.spyOn(S3Client.prototype, "send").mockImplementation(mocks.send);
  vi.spyOn(S3Client.prototype, "destroy").mockImplementation(mocks.destroy);
});

afterEach(() => vi.unstubAllEnvs());

describe("R2 signing", () => {
  it("signs an EU GET for the exact allowlisted key without binding Range", async () => {
    const before = Date.now();
    const result = await createPlaybackAccess("mp3");
    const url = new URL(result.url);
    expect(url.hostname).toContain(`${"a".repeat(32)}.eu.r2.cloudflarestorage.com`);
    expect(decodeURIComponent(url.pathname)).toContain("library/Special #1 + song.mp3");
    expect(url.searchParams.get("X-Amz-Expires")).toBe("900");
    expect(url.searchParams.get("X-Amz-SignedHeaders")).not.toContain("range");
    expect(url.searchParams.get("X-Amz-Signature")).toMatch(/^[a-f0-9]{64}$/);
    expect(Date.parse(result.expiresAt)).toBeGreaterThanOrEqual(
      Math.floor(before / 1000) * 1000 + 900_000,
    );
    expect(Date.parse(result.expiresAt)).toBeLessThanOrEqual(Date.now() + 900_000);
    expect(url.searchParams.get("X-Amz-Date")).toBe(
      new Date(Date.parse(result.expiresAt) - 900_000).toISOString()
        .replace(/[:-]|\.\d{3}/g, ""),
    );
    const head = mocks.send.mock.calls[0][0];
    expect(head).toBeInstanceOf(HeadObjectCommand);
    expect(head.input).toEqual({
      Bucket: "private-music", Key: "library/Special #1 + song.mp3",
    });
    expect(mocks.destroy).toHaveBeenCalledOnce();
  });

  it("supports short expiry for live expiry checks", async () => {
    vi.stubEnv("R2_PLAYBACK_TTL_SECONDS", "10");
    expect(new URL((await createPlaybackAccess("mp3")).url).searchParams.get("X-Amz-Expires")).toBe("10");
  });

  it.each(["0", "9", "901", "NaN", "10.5", ""])("rejects invalid TTL %s", async (ttl) => {
    vi.stubEnv("R2_PLAYBACK_TTL_SECONDS", ttl);
    await expect(createPlaybackAccess("mp3")).rejects.toThrow("R2_PLAYBACK_TTL_SECONDS");
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("rejects missing fixture configuration", async () => {
    vi.stubEnv("R2_FIXTURE_MP3_KEY", "");
    await expect(createPlaybackAccess("mp3")).rejects.toThrow("R2_FIXTURE_MP3_KEY");
  });

  it("rejects a malformed account ID", async () => {
    vi.stubEnv("R2_ACCOUNT_ID", "not-an-account");
    await expect(createPlaybackAccess("mp3")).rejects.toThrow("R2_ACCOUNT_ID");
  });

  it.each(["NotFound", "NoSuchKey"])("maps %s and releases the client", async (name) => {
    mocks.send.mockRejectedValue(Object.assign(new Error("missing"), { name }));
    await expect(createPlaybackAccess("mp3")).rejects.toBeInstanceOf(PlaybackObjectNotFoundError);
    expect(mocks.destroy).toHaveBeenCalledOnce();
  });

  it("does not disguise permission or network errors as missing objects", async () => {
    const error = Object.assign(new Error("denied"), { name: "AccessDenied" });
    mocks.send.mockRejectedValue(error);
    await expect(createPlaybackAccess("mp3")).rejects.toBe(error);
    expect(mocks.destroy).toHaveBeenCalledOnce();
  });
});
