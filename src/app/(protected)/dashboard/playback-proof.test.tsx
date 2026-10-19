// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PlaybackProof } from "./playback-proof";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockResolvedValue({
    ok: true,
    json: async () => ({
      url: "https://r2.example/sample?signature=test",
      expiresAt: "2026-10-15T10:00:00.000Z",
    }),
  });
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function load() {
  fireEvent.click(screen.getByRole("button", { name: "Load track" }));
  return await screen.findByLabelText<HTMLAudioElement>("R2 playback sample");
}

describe("playback proof", () => {
  it("loads on demand and does not request audio access on mount", async () => {
    render(<PlaybackProof />);
    expect(fetchMock).not.toHaveBeenCalled();
    const player = await load();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/playback",
      expect.objectContaining({
        method: "POST",
        body: '{"fixtureId":"mp3"}',
        cache: "no-store",
      }),
    );
    expect(player.controls).toBe(true);
  });

  it("renews at the remembered position even when signing returns the same URL", async () => {
    render(<PlaybackProof />);
    const oldPlayer = await load();
    oldPlayer.currentTime = 123;
    fireEvent.timeUpdate(oldPlayer);
    fireEvent.click(
      screen.getByRole("button", { name: "Renew access at current position" }),
    );
    await waitFor(() => {
      expect(screen.getByLabelText("R2 playback sample")).not.toBe(oldPlayer);
    });
    const player =
      screen.getByLabelText<HTMLAudioElement>("R2 playback sample");
    Object.defineProperty(player, "duration", { value: 300 });
    fireEvent.loadedMetadata(player);
    expect(player.currentTime).toBe(123);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
  });

  it("attempts to continue a playing track on renewal", async () => {
    render(<PlaybackProof />);
    const oldPlayer = await load();
    Object.defineProperty(oldPlayer, "paused", { value: false });
    fireEvent.click(
      screen.getByRole("button", { name: "Renew access at current position" }),
    );
    await waitFor(() =>
      expect(screen.getByLabelText("R2 playback sample")).not.toBe(oldPlayer),
    );
    fireEvent.loadedMetadata(screen.getByLabelText("R2 playback sample"));
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledOnce();
  });

  it("surfaces autoplay rejection instead of silently claiming successful resume", async () => {
    vi.mocked(HTMLMediaElement.prototype.play).mockRejectedValue(
      new Error("blocked"),
    );
    render(<PlaybackProof />);
    const oldPlayer = await load();
    Object.defineProperty(oldPlayer, "paused", { value: false });
    fireEvent.click(
      screen.getByRole("button", { name: "Renew access at current position" }),
    );
    await waitFor(() =>
      expect(screen.getByLabelText("R2 playback sample")).not.toBe(oldPlayer),
    );
    fireEvent.loadedMetadata(screen.getByLabelText("R2 playback sample"));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Press Play",
    );
  });

  it("surfaces media errors without an automatic retry loop", async () => {
    render(<PlaybackProof />);
    fireEvent.error(await load());
    expect(screen.getByRole("alert").textContent).toContain("renew it once");
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("clears the previous sample when selecting a new fixture", async () => {
    render(<PlaybackProof />);
    await load();
    fireEvent.change(screen.getByLabelText("Sample"), {
      target: { value: "m4a" },
    });
    expect(screen.queryByLabelText("R2 playback sample")).toBeNull();
    await load();
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/playback",
      expect.objectContaining({
        body: '{"fixtureId":"m4a"}',
      }),
    );
  });

  it("surfaces API failures", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Sign in again to load playback." }),
    });
    render(<PlaybackProof />);
    fireEvent.click(screen.getByRole("button", { name: "Load track" }));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Sign in again",
    );
    expect(screen.queryByLabelText("R2 playback sample")).toBeNull();
  });

  it("rejects malformed success responses", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        url: "javascript:alert(1)",
        expiresAt: "not a date",
      }),
    });
    render(<PlaybackProof />);
    fireEvent.click(screen.getByRole("button", { name: "Load track" }));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "invalid playback access",
    );
  });
});
