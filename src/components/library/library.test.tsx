// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Library } from "./library";
import { sampleTracks } from "./library.constants";

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
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const trackToTest = sampleTracks[0];

describe("private library", () => {
  it("identifies demo content", () => {
    render(<Library />);

    expect(
      screen.getByText(/demo content for layout and playback testing/i),
    ).toBeTruthy();
    expect(screen.getByText(trackToTest.title)).toBeTruthy();
  });

  it("keeps the player available while searching the collection", async () => {
    render(<Library />);

    const audioLabel = `${trackToTest.title} by ${trackToTest.artist}`;
    const ctaLabel = `Play ${audioLabel}`;

    fireEvent.click(screen.getByRole("button", { name: ctaLabel }));
    const player = await screen.findByLabelText<HTMLAudioElement>(audioLabel);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/playback",
      expect.objectContaining({
        method: "POST",
        body: '{"fixtureId":"mp3"}',
        cache: "no-store",
      }),
    );

    fireEvent.loadedMetadata(player);
    await waitFor(() =>
      expect(HTMLMediaElement.prototype.play).toHaveBeenCalledOnce(),
    );
  });
});
