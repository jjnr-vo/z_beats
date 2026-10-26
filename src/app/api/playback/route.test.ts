import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";
import { PlaybackObjectNotFoundError } from "@/lib/r2/r2";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  signLibrary: vi.fn(),
}));

const origin = "https://beats.example";
const trackKey = "library/Song #1.mp3";
const playbackAccess = {
  url: "https://r2.example/library?signature=private",
  expiresAt: "2026-10-15T10:00:00.000Z",
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: mocks.getUser } }),
}));
vi.mock("@/lib/r2/r2", () => ({
  createLibraryPlaybackAccess: mocks.signLibrary,
  PlaybackObjectNotFoundError: class extends Error {},
}));

function request(body = JSON.stringify({ key: trackKey }), requestOrigin = origin) {
  return new Request(`${origin}/api/playback`, {
    method: "POST",
    headers: { Origin: requestOrigin, "Content-Type": "application/json" },
    body,
  });
}

beforeEach(() => {
  mocks.getUser.mockResolvedValue({ data: { user: { id: "founder" } }, error: null });
  mocks.signLibrary.mockResolvedValue(playbackAccess);
});

describe("playback URL boundary", () => {
  it("signs the selected library key after authentication", async () => {
    const response = await POST(request(JSON.stringify({ key: trackKey })));
    expect(response.status).toBe(200);
    expect(mocks.signLibrary).toHaveBeenCalledWith(trackKey);
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
    expect(await response.json()).toEqual(playbackAccess);
    expect(mocks.getUser).toHaveBeenCalledOnce();
    expect(mocks.signLibrary).toHaveBeenCalledWith(trackKey);
  });

  it("rejects cross-origin issuance before authentication", async () => {
    const untrustedOrigin = "https://untrusted.example";
    expect((await POST(request(undefined, untrustedOrigin))).status).toBe(403);
    expect(mocks.getUser).not.toHaveBeenCalled();
    expect(mocks.signLibrary).not.toHaveBeenCalled();
  });

  it("does not redirect anonymous API callers", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    const response = await POST(request());
    expect(response.status).toBe(401);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(mocks.signLibrary).not.toHaveBeenCalled();
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
    expect(mocks.signLibrary).not.toHaveBeenCalled();
  });

  it("reports missing objects", async () => {
    mocks.signLibrary.mockRejectedValue(new PlaybackObjectNotFoundError());
    expect((await POST(request())).status).toBe(404);
  });

  it("reports operational errors without leaking SDK details", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.signLibrary.mockRejectedValue(new Error("secret signed URL"));
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
      expect(mocks.signLibrary).not.toHaveBeenCalled();
    },
  );
});
