import { beforeEach, describe, expect, it, vi } from "vitest";

import DashboardPage from "./page";

const sourceListing = { supported: [{ key: "song.mp3" }], unsupported: [] };
const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  listSourceLibrary: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/lib/r2/r2", () => ({ listSourceLibrary: mocks.listSourceLibrary }));
vi.mock("@/components/library/library", () => ({ Library: () => null }));

beforeEach(() => {
  mocks.requireUser.mockResolvedValue({ id: "founder" });
  mocks.listSourceLibrary.mockResolvedValue(sourceListing);
});

describe("dashboard listing", () => {
  it("authenticates before loading R2 directly without an internal HTTP request", async () => {
    const fetch = vi.spyOn(globalThis, "fetch");
    const page = await DashboardPage();
    expect(mocks.requireUser).toHaveBeenCalledOnce();
    expect(mocks.listSourceLibrary).toHaveBeenCalledOnce();
    expect(mocks.requireUser.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.listSourceLibrary.mock.invocationCallOrder[0],
    );
    expect(fetch).not.toHaveBeenCalled();
    expect(page.props.children[1].props.listing).toBe(sourceListing);
  });

  it("does not list objects when authentication redirects", async () => {
    mocks.requireUser.mockRejectedValue(new Error("NEXT_REDIRECT"));
    await expect(DashboardPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.listSourceLibrary).not.toHaveBeenCalled();
  });

  it("propagates listing failures instead of using an invalid count", async () => {
    mocks.listSourceLibrary.mockRejectedValue(new Error("Listing unavailable"));
    await expect(DashboardPage()).rejects.toThrow("Listing unavailable");
  });
});
