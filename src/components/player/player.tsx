import type { Dispatch, RefObject, SetStateAction } from "react";

import type { PlayerTrack } from "../library/library.types";
import { artworkClasses } from "@/shared/artwork";

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
        className="fixed inset-x-0 bottom-0 z-20 px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      >
        <div className="mx-auto flex w-full max-w-[64.5rem] flex-col gap-3 rounded-2xl border border-[#687f9b] bg-[linear-gradient(#f9fcff,#acb9cc_49%,#e0e7f2_51%,#a2afc2)] p-3 shadow-[inset_0_2px_1px_white,0_12px_22px_#344c7244] sm:flex-row sm:items-center sm:gap-6 sm:p-4">
          <div className="flex min-w-0 items-center gap-3 rounded-lg border border-[#192e5a] bg-[linear-gradient(174deg,#21488f,#0e2256_58%)] px-3 py-2 text-[#d8f8ff] shadow-[inset_0_2px_6px_#050d2acc,0_1px_white] sm:w-[22rem]">
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
                  <p className="truncate text-sm font-bold">{playerTrack.track.title}</p>
                  <p className="truncate text-xs">{playerTrack.track.artist}</p>
                </div>
              </>
            ) : (
              <div>
                <p className="text-sm font-bold">Nothing playing</p>
                <p className="text-xs">Choose a track to start.</p>
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
              <p className="hidden text-xs text-[#435773] sm:block">
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
