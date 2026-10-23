import type { Dispatch, RefObject, SetStateAction } from "react";

import { artworkClasses } from "../library/library.constants";
import type { PlayerTrack } from "../library/library.types";

export function Player({
  audio,
  error,
  playerTrack,
  setError,
  startPlayback,
}: {
  audio: RefObject<HTMLAudioElement | null>;
  error: string | null;
  playerTrack: PlayerTrack | null;
  setError: Dispatch<SetStateAction<string | null>>;
  startPlayback: () => Promise<void>;
}) {
  return (
    <>
      <footer
        aria-label="Now playing"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-[#cbd5d1] bg-[#f7f8f5]/95 shadow-[0_-8px_28px_rgba(23,42,56,0.06)] backdrop-blur"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-6 sm:px-8">
          <div className="flex min-w-0 items-center gap-3 sm:w-[22rem]">
            {playerTrack ? (
              <>
                <div
                  aria-hidden="true"
                  className={`relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-md ${artworkClasses[playerTrack.track.artwork]}`}
                >
                  {/* TODO: separate the logic for artwork so it can be used when missing data */}
                  <span className="absolute -right-2 -top-3 size-8 rounded-full border border-white/45" />
                  <span className="relative size-3 rounded-full bg-white/65" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[#172a38]">
                    {playerTrack.track.title}
                  </p>
                  <p className="truncate text-xs text-[#687981]">
                    {playerTrack.track.artist}
                  </p>
                </div>
              </>
            ) : (
              <div>
                <p className="text-sm font-medium text-[#344b58]">
                  Nothing playing
                </p>
                <p className="text-xs text-[#687981]">
                  Choose a sample track to start.
                </p>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            {playerTrack ? (
              <audio
                ref={audio}
                key={playerTrack.generation}
                aria-label={`${playerTrack.track.title} by ${playerTrack.track.artist}`}
                className="h-10 w-full"
                controls
                onError={() =>
                  setError(
                    "Audio could not be loaded. Access may have expired; try selecting the track again.",
                  )
                }
                onLoadedMetadata={() => void startPlayback()}
                preload="metadata"
                src={playerTrack.access.url}
              />
            ) : (
              <p className="hidden text-xs text-[#829096] sm:block">
                Playback stays available while you browse your library.
              </p>
            )}
          </div>
        </div>
      </footer>

      {error && (
        <div
          aria-label="Playback message"
          className="fixed bottom-28 left-4 right-4 z-30 mx-auto max-w-xl rounded-lg border border-[#d9b0a2] bg-[#fff8f5] px-4 py-3 text-sm text-[#7e3825] shadow-lg sm:bottom-24"
          role="alert"
        >
          {error}
        </div>
      )}
    </>
  );
}
