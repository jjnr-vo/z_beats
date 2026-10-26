import { HeadObjectCommand, ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createLibraryPlaybackAccess, listSourceLibrary, PlaybackObjectNotFoundError } from "./r2";
import { trackFormatFixtures } from "@/utils/track-format";

vi.mock("server-only", () => ({}));

const accountId = "a".repeat(32);
const bucketName = "private-music";
const defaultTtlSeconds = 900;
const sourcePrefix = "library/";

const mocks = vi.hoisted(() => ({
  send: vi.fn(),
  destroy: vi.fn(),
}));

beforeEach(() => {
  vi.stubEnv("R2_ACCOUNT_ID", accountId);
  vi.stubEnv("R2_BUCKET_NAME", bucketName);
  vi.stubEnv("R2_ACCESS_KEY_ID", "test-access");
  vi.stubEnv("R2_SECRET_ACCESS_KEY", "test-secret");
  vi.stubEnv("R2_PLAYBACK_TTL_SECONDS", String(defaultTtlSeconds));
  vi.stubEnv("R2_SOURCE_PREFIX", sourcePrefix);
  mocks.send.mockResolvedValue({});
  vi.spyOn(S3Client.prototype, "send").mockImplementation(mocks.send);
  vi.spyOn(S3Client.prototype, "destroy").mockImplementation(mocks.destroy);
});

afterEach(() => vi.unstubAllEnvs());

describe("source library playback", () => {
  it("signs the exact supported key after checking the source listing", async () => {
    const key = "library/Artist/Song #1 + mix.MP3";
    mocks.send.mockResolvedValueOnce({ Contents: [{ Key: key, Size: 1024 }] });
    const result = await createLibraryPlaybackAccess(key);
    expect(decodeURIComponent(new URL(result.url).pathname)).toContain(key);
    expect(mocks.send.mock.calls[0][0]).toBeInstanceOf(ListObjectsV2Command);
    expect(mocks.send.mock.calls[0][0].input.Prefix).toBe(sourcePrefix);
    expect(mocks.send.mock.calls[1][0].input.Key).toBe(key);
    expect(mocks.destroy).toHaveBeenCalledTimes(2);
  });

  it.each(["outside/song.mp3", "library/cover.jpg"])(
    "does not sign a key outside the supported listing: %s",
    async (key) => {
      mocks.send.mockResolvedValueOnce({ Contents: [{ Key: "library/cover.jpg" }] });
      await expect(createLibraryPlaybackAccess(key)).rejects.toBeInstanceOf(
        PlaybackObjectNotFoundError,
      );
      expect(mocks.send).toHaveBeenCalledOnce();
    },
  );

  it("collects objects across pages using the shared extensions", async () => {
    mocks.send
      .mockResolvedValueOnce({
        Contents: [{ Key: "library/" }, { Key: "library/first.mp3" }],
        IsTruncated: true,
        NextContinuationToken: "next",
      })
      .mockResolvedValueOnce({
        Contents: [
          ...trackFormatFixtures.map((extension) => ({ Key: `library/track.${extension}` })),
          { Key: "library/notes.txt" },
        ],
        IsTruncated: false,
      });
    const listing = await listSourceLibrary();
    expect(listing.supported.map(({ key }) => key)).toEqual([
      "library/first.mp3",
      ...trackFormatFixtures.map((extension) => `library/track.${extension}`),
    ]);
    expect(listing.unsupported.map(({ key }) => key)).toEqual(["library/notes.txt"]);
    expect(mocks.send.mock.calls[1][0].input.ContinuationToken).toBe("next");
    expect(mocks.destroy).toHaveBeenCalledOnce();
  });

  it("does not sign when listing fails", async () => {
    mocks.send.mockRejectedValue(new Error("Listing unavailable"));
    await expect(createLibraryPlaybackAccess("library/song.mp3")).rejects.toThrow(
      "Listing unavailable",
    );
    expect(mocks.send).toHaveBeenCalledOnce();
    expect(mocks.destroy).toHaveBeenCalledOnce();
  });
});

describe("R2 signing", () => {
  const trackKey = "library/Special #1 + song.mp3";
  const shortTtlSeconds = 10;

  it("signs an EU GET for the named track without binding Range", async () => {
    mocks.send.mockResolvedValueOnce({ Contents: [{ Key: trackKey }] });
    const before = Date.now();
    const result = await createLibraryPlaybackAccess(trackKey);
    const url = new URL(result.url);
    expect(url.hostname).toContain(`${accountId}.eu.r2.cloudflarestorage.com`);
    expect(decodeURIComponent(url.pathname)).toContain(trackKey);
    expect(url.searchParams.get("X-Amz-Expires")).toBe(String(defaultTtlSeconds));
    expect(url.searchParams.get("X-Amz-SignedHeaders")).not.toContain("range");
    expect(url.searchParams.get("X-Amz-Signature")).toMatch(/^[a-f0-9]{64}$/);
    expect(Date.parse(result.expiresAt)).toBeGreaterThanOrEqual(
      Math.floor(before / 1000) * 1000 + defaultTtlSeconds * 1000,
    );
    expect(Date.parse(result.expiresAt)).toBeLessThanOrEqual(Date.now() + defaultTtlSeconds * 1000);
    expect(url.searchParams.get("X-Amz-Date")).toBe(
      new Date(Date.parse(result.expiresAt) - defaultTtlSeconds * 1000)
        .toISOString()
        .replace(/[:-]|\.\d{3}/g, ""),
    );
    expect(mocks.send.mock.calls[0][0]).toBeInstanceOf(ListObjectsV2Command);
    const head = mocks.send.mock.calls[1][0];
    expect(head).toBeInstanceOf(HeadObjectCommand);
    expect(head.input).toEqual({
      Bucket: bucketName,
      Key: trackKey,
    });
    expect(mocks.destroy).toHaveBeenCalledTimes(2);
  });

  it("supports short expiry for live expiry checks", async () => {
    mocks.send.mockResolvedValueOnce({ Contents: [{ Key: trackKey }] });
    vi.stubEnv("R2_PLAYBACK_TTL_SECONDS", String(shortTtlSeconds));
    expect(
      new URL((await createLibraryPlaybackAccess(trackKey)).url).searchParams.get("X-Amz-Expires"),
    ).toBe(String(shortTtlSeconds));
  });

  it.each(["0", "9", "901", "NaN", "10.5", ""])("rejects invalid TTL %s", async (ttl) => {
    mocks.send.mockResolvedValueOnce({ Contents: [{ Key: trackKey }] });
    vi.stubEnv("R2_PLAYBACK_TTL_SECONDS", ttl);
    await expect(createLibraryPlaybackAccess(trackKey)).rejects.toThrow("R2_PLAYBACK_TTL_SECONDS");
    expect(mocks.send).toHaveBeenCalledOnce();
  });

  it("rejects a track that is not present in the source listing", async () => {
    mocks.send.mockResolvedValueOnce({ Contents: [{ Key: "library/other-track.mp3" }] });
    await expect(createLibraryPlaybackAccess(trackKey)).rejects.toBeInstanceOf(
      PlaybackObjectNotFoundError,
    );
    expect(mocks.send).toHaveBeenCalledOnce();
  });

  it("rejects a malformed account ID", async () => {
    vi.stubEnv("R2_ACCOUNT_ID", "not-an-account");
    await expect(createLibraryPlaybackAccess(trackKey)).rejects.toThrow("R2_ACCOUNT_ID");
  });

  it.each(["NotFound", "NoSuchKey"])("maps %s and releases the client", async (name) => {
    mocks.send
      .mockResolvedValueOnce({ Contents: [{ Key: trackKey }] })
      .mockRejectedValueOnce(Object.assign(new Error("missing"), { name }));
    await expect(createLibraryPlaybackAccess(trackKey)).rejects.toBeInstanceOf(
      PlaybackObjectNotFoundError,
    );
    expect(mocks.destroy).toHaveBeenCalledTimes(2);
  });

  it("does not disguise permission or network errors as missing objects", async () => {
    const error = Object.assign(new Error("denied"), { name: "AccessDenied" });
    mocks.send
      .mockResolvedValueOnce({ Contents: [{ Key: trackKey }] })
      .mockRejectedValueOnce(error);
    await expect(createLibraryPlaybackAccess(trackKey)).rejects.toBe(error);
    expect(mocks.destroy).toHaveBeenCalledTimes(2);
  });
});
