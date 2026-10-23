"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { PlayerTrack } from "./library.types";
import { LibraryView } from "./library.view";
import { Player } from "../player/player";
import { isPlaybackAccess } from "@/lib/playback";
import { sampleTracks, type Track } from "@/shared/tracks";

export function Library() {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("added");
  const [playerTrack, setPlayerTrack] = useState<PlayerTrack | null>(null);
  const [loadingTrackId, setLoadingTrackId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const pendingRequest = useRef<AbortController | null>(null);
  const shouldStartPlayback = useRef(false);

  useEffect(() => () => pendingRequest.current?.abort(), []);

  const visibleTracks = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    // TODO: Remove sampleTracks in favour of music from R2
    const matches = sampleTracks.filter((track) =>
      [track.title, track.artist, track.album]
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
        return matches;
    }
  }, [query, sort]);

  async function playTrack(track: Track) {
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
        shouldStartPlayback.current = true;
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

  async function startPlayback() {
    if (!shouldStartPlayback.current || !audio.current) return;
    shouldStartPlayback.current = false;
    try {
      await audio.current.play();
    } catch {
      setError("Playback could not start automatically. Press Play in the player.");
    }
  }

  return (
    <>
      <LibraryView
        loadingTrackId={loadingTrackId}
        playTrack={playTrack}
        query={query}
        setQuery={setQuery}
        setSort={setSort}
        sort={sort}
        visibleTracks={visibleTracks}
      />
      <Player
        audio={audio}
        error={error}
        playerTrack={playerTrack}
        setError={setError}
        startPlayback={startPlayback}
      />
    </>
  );
}

async function getTrack(track: Track, controller: AbortController) {
  const response = await fetch("/api/playback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fixtureId: track.fixtureId }),
    cache: "no-store",
    signal: controller.signal,
  });
  const body: unknown = await response.json();
  if (!response.ok) {
    const message =
      body && typeof body === "object" && "error" in body && typeof body.error === "string"
        ? body.error
        : "Unable to load this sample. Try again.";
    throw new Error(message);
  }

  return body;
}
