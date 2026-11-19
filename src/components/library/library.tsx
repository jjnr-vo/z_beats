"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { LibraryTrack } from "./library.types";
import { LibraryView } from "./library.view";
import { Player } from "../player/player";
import type { SourceListing } from "@/lib/r2/r2";
import type { PlayerTrack } from "@/shared/player-track";
import { isPlaybackAccess } from "@/utils/playback";

export function Library({ listing }: { listing: SourceListing }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("added");
  const [playerTrack, setPlayerTrack] = useState<PlayerTrack | null>(null);
  const [loadingTrackId, setLoadingTrackId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pendingRequest = useRef<AbortController | null>(null);

  useEffect(() => () => pendingRequest.current?.abort(), []);

  const tracks = useMemo<LibraryTrack[]>(
    () =>
      listing.supported.map((object) => ({
        id: object.key,
        title: object.key.slice(object.key.lastIndexOf("/") + 1).replace(/\.[^.]+$/, ""),
        artist: "Unknown artist",
        artwork: object.artwork,
        album: "Unknown album",
        duration: "--:--",
        lastModified: object.lastModified,
      })),
    [listing],
  );

  const visibleTracks = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const matches = tracks.filter((track) =>
      [track.title, track.artist, track.album, track.id]
        .join(" ")
        .toLocaleLowerCase()
        .includes(normalizedQuery),
    );

    switch (sort) {
      case "title":
        return matches.sort((a, b) => a.title.localeCompare(b.title));
      case "artist":
        return matches.sort(
          (a, b) => a.artist.localeCompare(b.artist) || a.title.localeCompare(b.title),
        );
      case "album":
        return matches.sort(
          (a, b) => a.album.localeCompare(b.album) || a.title.localeCompare(b.title),
        );
      default:
        return matches.sort(
          (a, b) => b.lastModified.localeCompare(a.lastModified) || a.id.localeCompare(b.id),
        );
    }
  }, [query, sort, tracks]);

  async function playTrack(track: LibraryTrack) {
    pendingRequest.current?.abort();
    const controller = new AbortController();
    pendingRequest.current = controller;
    setLoadingTrackId(track.id);
    setError(null);

    try {
      const trackResponse = await getTrack(track, controller);
      if (!isPlaybackAccess(trackResponse)) {
        throw new Error("The server returned invalid playback access.");
      }
      if (!controller.signal.aborted) {
        setPlayerTrack((current) => ({
          track,
          access: trackResponse,
          generation: (current?.generation ?? 0) + 1,
        }));
      }
    } catch (cause) {
      if (!controller.signal.aborted) {
        setError(cause instanceof Error ? cause.message : "Playback request failed.");
      }
    } finally {
      if (!controller.signal.aborted) setLoadingTrackId(null);
    }
  }

  return (
    <>
      <LibraryView
        currentTrackId={playerTrack?.track.id}
        totalTracks={tracks.length}
        unsupportedCount={listing.unsupported.length}
        loadingTrackId={loadingTrackId}
        playTrack={playTrack}
        query={query}
        setQuery={setQuery}
        setSort={setSort}
        sort={sort}
        visibleTracks={visibleTracks}
      />
      <Player error={error} playerTrack={playerTrack} setError={setError} />
    </>
  );
}

async function getTrack(track: LibraryTrack, controller: AbortController) {
  const response = await fetch("/api/playback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key: track.id }),
    cache: "no-store",
    signal: controller.signal,
  });
  const body: unknown = await response.json();
  if (!response.ok) {
    const message =
      body && typeof body === "object" && "error" in body && typeof body.error === "string"
        ? body.error
        : "Unable to load this track. Try again.";
    throw new Error(message);
  }

  return body;
}
