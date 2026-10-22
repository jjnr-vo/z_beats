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

describe("private library", () => {
  it("identifies demo content and searches by title, artist, or album", () => {
    render(<Library />);

    expect(
      screen.getByText(/demo content for layout and playback testing/i),
    ).toBeTruthy();
    expect(screen.getByText("A Small Weather")).toBeTruthy();

    fireEvent.change(
      screen.getByRole("searchbox", { name: "Search your library" }),
      {
        target: { value: "North Window" },
      },
    );

    expect(screen.getByText("Low Lantern")).toBeTruthy();
    expect(screen.queryByText("A Small Weather")).toBeNull();

    fireEvent.change(
      screen.getByRole("searchbox", { name: "Search your library" }),
      {
        target: { value: "Soft Geometry" },
      },
    );
    expect(screen.getByText("Still, the River")).toBeTruthy();
    expect(screen.queryByText("Low Lantern")).toBeNull();
  });

  it("keeps the player available while searching the collection", async () => {
    render(<Library />);

    const trackTitle = "A Small Weather";
    const trackArtist = "Mara Vale";
    const audioLabel = `${trackTitle} by ${trackArtist}`;
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

    fireEvent.change(
      screen.getByRole("searchbox", { name: "Search your library" }),
      {
        target: { value: "North Window" },
      },
    );
    expect(
      screen.getByLabelText(audioLabel, { selector: "audio" }),
    ).toBeTruthy();
    expect(screen.getByText("Low Lantern")).toBeTruthy();
  });
});
