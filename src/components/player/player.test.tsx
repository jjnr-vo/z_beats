// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Player } from "./player";

const track = {
  track: { id: "track", title: "Test track", artist: "Test artist" },
  access: { url: "https://r2.example/track", expiresAt: "2026-11-20T00:00:00Z" },
  generation: 1,
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Ice Deck visualizer", () => {
  it("samples playing audio only when enabled and stops on reduced motion and pause", () => {
    const fillRect = vi.fn();
    const clearRect = vi.fn();
    const analyser = {
      context: { sampleRate: 48_000 },
      frequencyBinCount: 2048,
      getByteFrequencyData: vi.fn((bins: Uint8Array) => {
        bins[10] = 192;
      }),
    };
    const createMediaElementSource = vi.fn(() => ({ connect: vi.fn(), disconnect: vi.fn() }));
    const context = vi.fn(function () {
      return {
        state: "running",
        destination: {},
        createAnalyser: () => analyser,
        createMediaElementSource,
        close: vi.fn().mockResolvedValue(undefined),
      };
    });
    vi.stubGlobal("AudioContext", context);
    vi.stubGlobal("matchMedia", () => motion);
    const motion = {
      matches: false,
      addEventListener: vi.fn<(_type: string, callback: () => void) => void>(),
      removeEventListener: vi.fn(),
    };
    const requestFrame = vi.fn<(_callback: FrameRequestCallback) => number>().mockReturnValue(1);
    const cancelFrame = vi.fn();
    vi.stubGlobal("requestAnimationFrame", requestFrame);
    vi.stubGlobal("cancelAnimationFrame", cancelFrame);
    const surface: Pick<
      CanvasRenderingContext2D,
      "clearRect" | "fillRect" | "createLinearGradient"
    > = {
      clearRect,
      fillRect,
      createLinearGradient: () => ({ addColorStop: vi.fn() }),
    };
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      surface as CanvasRenderingContext2D,
    );

    render(<Player error={null} playerTrack={track} setError={vi.fn()} />);
    const audio = screen.getByLabelText<HTMLAudioElement>(
      `${track.track.title} by ${track.track.artist}`,
    );
    const toggle = screen.getByRole("button", { name: "Visualizer" });
    let paused = false;
    Object.defineProperty(audio, "paused", { get: () => paused });
    fireEvent.play(audio);
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    expect(context).not.toHaveBeenCalled();

    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    expect(createMediaElementSource).toHaveBeenCalledWith(audio);
    requestFrame.mock.lastCall?.[0](0);
    expect(analyser.getByteFrequencyData).toHaveBeenCalledOnce();
    expect(fillRect).toHaveBeenCalled();

    motion.matches = true;
    requestFrame.mockClear();
    act(() => motion.addEventListener.mock.lastCall?.[1]());
    expect(cancelFrame).toHaveBeenCalled();
    expect(clearRect).toHaveBeenCalled();
    expect(requestFrame).not.toHaveBeenCalled();

    paused = true;
    fireEvent.pause(audio);
    expect(motion.removeEventListener).toHaveBeenCalled();
    fireEvent.click(toggle);
    fireEvent.click(toggle);
    expect(createMediaElementSource).toHaveBeenCalledOnce();
  });
});
