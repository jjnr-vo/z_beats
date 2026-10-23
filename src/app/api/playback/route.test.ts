import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";
import { PlaybackObjectNotFoundError } from "@/lib/r2/r2";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  sign: vi.fn(),
  signLibrary: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: mocks.getUser } }),
}));
vi.mock("@/lib/r2/r2", () => ({
  createPlaybackAccess: mocks.sign,
  createLibraryPlaybackAccess: mocks.signLibrary,
  PlaybackObjectNotFoundError: class extends Error {},
}));

function request(body = '{"fixtureId":"mp3"}', origin = "https://beats.example") {
  return new Request("https://beats.example/api/playback", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body,
  });
}

beforeEach(() => {
  mocks.getUser.mockResolvedValue({ data: { user: { id: "founder" } }, error: null });
  mocks.sign.mockResolvedValue({
    url: "https://r2.example/sample?signature=private",
    expiresAt: "2026-10-15T10:00:00.000Z",
  });
  mocks.signLibrary.mockResolvedValue({
    url: "https://r2.example/library?signature=private",
    expiresAt: "2026-10-15T10:00:00.000Z",
  });
});

describe("playback URL boundary", () => {
  it("signs the selected library key after authentication", async () => {
    const response = await POST(request(JSON.stringify({ key: "library/Song #1.mp3" })));
    expect(response.status).toBe(200);
    expect(mocks.signLibrary).toHaveBeenCalledWith("library/Song #1.mp3");
    expect(mocks.sign).not.toHaveBeenCalled();
  });

  it.each([{ key: "" }, { key: 3 }, { key: "song.mp3", fixtureId: "mp3" }])(
    "rejects invalid library selection %j",
    async (body) => {
      expect((await POST(request(JSON.stringify(body)))).status).toBe(400);
      expect(mocks.signLibrary).not.toHaveBeenCalled();
    },
  );

  it("does not sign library keys for anonymous requests", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    expect((await POST(request('{"key":"song.mp3"}'))).status).toBe(401);
    expect(mocks.signLibrary).not.toHaveBeenCalled();
  });

  it("reports library keys outside the supported listing as missing", async () => {
    mocks.signLibrary.mockRejectedValue(new PlaybackObjectNotFoundError());
    expect((await POST(request('{"key":"private.txt"}'))).status).toBe(404);
  });
  it("authenticates each request and returns uncached access", async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual(await mocks.sign.mock.results[0].value);
    expect(mocks.getUser).toHaveBeenCalledOnce();
    expect(mocks.sign).toHaveBeenCalledWith("mp3");
  });

  it("rejects cross-origin issuance before authentication", async () => {
    expect((await POST(request(undefined, "https://untrusted.example"))).status).toBe(403);
    expect(mocks.getUser).not.toHaveBeenCalled();
    expect(mocks.sign).not.toHaveBeenCalled();
  });

  it("does not redirect anonymous API callers", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    const response = await POST(request());
    expect(response.status).toBe(401);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(mocks.sign).not.toHaveBeenCalled();
  });

  it.each([
    "not json",
    "null",
    "[]",
    "{}",
    '{"fixtureId":"../secret"}',
    '{"fixtureId":"https://evil.example"}',
    '{"fixtureId":42}',
  ])("rejects invalid fixture selection: %s", async (body) => {
    expect((await POST(request(body))).status).toBe(400);
    expect(mocks.sign).not.toHaveBeenCalled();
  });

  it("reports missing objects", async () => {
    mocks.sign.mockRejectedValue(new PlaybackObjectNotFoundError());
    expect((await POST(request())).status).toBe(404);
  });

  it("reports operational errors without leaking SDK details", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.sign.mockRejectedValue(new Error("secret signed URL"));
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(JSON.stringify(await response.json())).not.toContain("secret");
    expect(JSON.stringify(log.mock.calls)).not.toContain("secret");
  });

  it.each([503, 0, undefined])(
    "reports auth service failures (%s) without signing",
    async (status) => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      mocks.getUser.mockResolvedValue({
        data: { user: null },
        error: { status },
      });
      expect((await POST(request())).status).toBe(503);
      expect(mocks.sign).not.toHaveBeenCalled();
    },
  );
});
