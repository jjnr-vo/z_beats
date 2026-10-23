// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Library } from "./library";
import type { SourceListing } from "@/lib/r2/r2";

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

const listing: SourceListing = {
  supported: [
    {
      key: "library/Artist/First #1 + song.mp3",
      size: 1024,
      etag: "first",
      lastModified: "2026-10-20T10:00:00.000Z",
    },
    {
      key: "library/Other/Second song.m4a",
      size: 2048,
      etag: "second",
      lastModified: "2026-10-23T10:00:00.000Z",
    },
  ],
  unsupported: [{ key: "library/cover.jpg", size: 50, etag: "", lastModified: "" }],
};

describe("private library", () => {
  it("renders supported listing objects rather than demo tracks", () => {
    render(<Library listing={listing} />);

    expect(screen.getByText("First #1 + song")).toBeTruthy();
    expect(screen.getByText("Second song")).toBeTruthy();
    expect(screen.getByText("2 of 2 tracks")).toBeTruthy();
    expect(screen.getByText(/1 unsupported files excluded/)).toBeTruthy();
    expect(screen.queryByText("cover")).toBeNull();
    expect(screen.queryByText(/demo content/i)).toBeNull();
    expect(
      screen.getAllByRole("button", { name: /^Play / })[0].getAttribute("aria-label"),
    ).toContain("Second song");
  });

  it("keeps the player available while searching the collection", async () => {
    render(<Library listing={listing} />);

    const audioLabel = "First #1 + song by Unknown artist";
    const ctaLabel = `Play ${audioLabel}`;

    fireEvent.click(screen.getByRole("button", { name: ctaLabel }));
    const player = await screen.findByLabelText<HTMLAudioElement>(audioLabel);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/playback",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ key: listing.supported[0].key }),
        cache: "no-store",
      }),
    );

    fireEvent.loadedMetadata(player);
    await waitFor(() => expect(HTMLMediaElement.prototype.play).toHaveBeenCalledOnce());
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Second" } });
    expect(screen.queryByRole("button", { name: ctaLabel })).toBeNull();
    expect(screen.getByLabelText(audioLabel, { selector: "audio" })).toBe(player);
    expect(screen.getByText("1 of 2 tracks")).toBeTruthy();
  });

  it("sorts by filename title and searches object paths", () => {
    render(<Library listing={listing} />);
    fireEvent.change(screen.getByRole("combobox", { name: "Sort tracks" }), {
      target: { value: "title" },
    });
    expect(
      screen.getAllByRole("button", { name: /^Play / })[0].getAttribute("aria-label"),
    ).toContain("First #1 + song");
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Other/" } });
    expect(screen.queryByText("First #1 + song")).toBeNull();
    expect(screen.getByText("Second song")).toBeTruthy();
  });

  it("shows an empty library without substituting sample tracks", () => {
    render(<Library listing={{ supported: [], unsupported: [] }} />);
    expect(screen.getByText("Your library is empty")).toBeTruthy();
    expect(screen.getByText("0 of 0 tracks")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^Play / })).toBeNull();
  });

  it("reports playback failures", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "This track is missing from the source library." }),
    });
    render(<Library listing={listing} />);
    fireEvent.click(screen.getAllByRole("button", { name: /^Play / })[0]);
    expect((await screen.findByRole("alert")).textContent).toContain(
      "This track is missing from the source library.",
    );
  });
});
