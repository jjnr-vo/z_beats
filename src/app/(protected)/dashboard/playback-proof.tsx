"use client";

import { useEffect, useRef, useState } from "react";

import {
  isPlaybackAccess,
  isPlaybackFixtureId,
  type PlaybackAccess,
  type PlaybackFixtureId,
  playbackFixtures,
} from "@/lib/playback";

/**
 * @deprecated
 *
 * Component to be removed when library collects more smaples with different music formats
 */
export function PlaybackProof() {
  const [fixtureId, setFixtureId] = useState<PlaybackFixtureId>("mp3");
  const [access, setAccess] = useState<
    (PlaybackAccess & { generation: number }) | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const pendingRequest = useRef<AbortController | null>(null);
  const restore = useRef({ position: 0, playing: false });
  const lastPosition = useRef(0);

  useEffect(() => () => pendingRequest.current?.abort(), []);

  async function loadTrack(refresh: boolean) {
    pendingRequest.current?.abort();
    const controller = new AbortController();
    pendingRequest.current = controller;
    restore.current = {
      position: refresh ? lastPosition.current : 0,
      playing: refresh && !!audio.current && !audio.current.paused,
    };
    audio.current?.pause();
    if (!refresh) lastPosition.current = 0;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/playback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fixtureId }),
        cache: "no-store",
        signal: controller.signal,
      });
      const body: unknown = await response.json();
      if (!response.ok) {
        const message =
          body &&
          typeof body === "object" &&
          "error" in body &&
          typeof body.error === "string"
            ? body.error
            : "Unable to obtain playback access. Try again.";
        throw new Error(message);
      }
      if (!isPlaybackAccess(body)) {
        throw new Error("The server returned invalid playback access.");
      }
      if (!controller.signal.aborted) {
        setAccess((current) => ({
          ...body,
          generation: (current?.generation ?? 0) + 1,
        }));
      }
    } catch (cause) {
      if (!controller.signal.aborted) {
        setError(
          cause instanceof Error ? cause.message : "Playback request failed.",
        );
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  async function restorePlayback() {
    const player = audio.current;
    if (!player) return;
    const { position, playing } = restore.current;
    try {
      player.currentTime = Number.isFinite(player.duration)
        ? Math.min(position, Math.max(0, player.duration - 0.05))
        : position;
      if (playing) await player.play();
    } catch {
      setError(
        "Playback was renewed, but could not resume automatically. Press Play or seek manually.",
      );
    }
  }

  return (
    <section className="space-y-5 rounded-3xl border border-white/10 bg-white/5 p-8">
      <div>
        <h2 className="text-xl font-semibold">R2 signed playback proof</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-300">
          Load a configured sample, then test playback and seeking. Audio
          streams directly from private R2 storage. Access links expire; renew
          access to reload the same track near your current position.
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="grid gap-2 text-sm">
          Sample
          <select
            className="rounded-lg border border-white/20 bg-zinc-900 px-3 py-2"
            value={fixtureId}
            disabled={loading}
            onChange={(event) => {
              if (!isPlaybackFixtureId(event.target.value)) return;
              audio.current?.pause();
              setFixtureId(event.target.value);
              setAccess(null);
              setError(null);
              lastPosition.current = 0;
            }}
          >
            {playbackFixtures.map((fixture) => (
              <option key={fixture.id} value={fixture.id}>
                {fixture.label}
              </option>
            ))}
          </select>
        </label>
        <button
          className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-50"
          disabled={loading}
          onClick={() => void loadTrack(false)}
          type="button"
        >
          {loading ? "Loading..." : "Load track"}
        </button>
        {access && (
          <button
            className="rounded-lg border border-white/20 px-4 py-2 text-sm disabled:opacity-50"
            disabled={loading}
            onClick={() => void loadTrack(true)}
            type="button"
          >
            Renew access at current position
          </button>
        )}
      </div>
      <div aria-busy={loading}>
        {access && (
          <>
            {/* A new URL remounts the media element before position restoration. */}
            <audio
              key={access.generation}
              ref={audio}
              aria-label="R2 playback sample"
              className="w-full"
              controls
              preload="metadata"
              src={access.url}
              onLoadedMetadata={() => void restorePlayback()}
              onTimeUpdate={() => {
                if (audio.current && !audio.current.error) {
                  lastPosition.current = audio.current.currentTime;
                }
              }}
              onError={() =>
                setError(
                  "Audio could not be loaded. Access may have expired; renew it once. If it still fails, check the file codec, R2 content type, CORS, and network.",
                )
              }
            />
            <p className="mt-2 text-sm text-zinc-400">
              Access expires at{" "}
              {new Date(access.expiresAt).toLocaleTimeString()}. Renewal is
              manual; there are no automatic retry loops.
            </p>
          </>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}
      <p className="text-xs leading-5 text-zinc-400">
        Proof only: no saved resume position or offline mode. Anyone holding an
        access URL can fetch the file until expiry, even after sign-out.
      </p>
    </section>
  );
}
