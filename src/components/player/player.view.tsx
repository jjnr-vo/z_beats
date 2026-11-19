import type { PlayerTrack } from "@/shared/player-track";

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

export function PlayerView({
  currentTime,
  duration,
  error,
  onSeek,
  onTogglePlayback,
  onVolumeChange,
  playing,
  track,
  volume,
}: {
  currentTime: number;
  duration: number;
  error: string | null;
  onSeek: (time: number) => void;
  onTogglePlayback: () => void;
  onVolumeChange: (level: number) => void;
  playing: boolean;
  track?: PlayerTrack["track"];
  volume: number;
}) {
  return (
    <footer
      aria-label="Now playing"
      className="fixed inset-x-0 bottom-0 z-20 bg-[linear-gradient(transparent,#c8d6e8_42%)] px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <div className="mx-auto max-w-[64.5rem]">
        {error && (
          <div
            className="mb-2 rounded-lg border border-[#d9b0a2] bg-[#fff8f5] px-4 py-2 text-sm text-[#7e3825]"
            role="alert"
          >
            {error}
          </div>
        )}
        <div className="grid grid-cols-[3.25rem_minmax(0,1fr)] items-center gap-3 rounded-2xl border border-[#687f9b] bg-[linear-gradient(#f9fcff,#acb9cc_49%,#e0e7f2_51%,#a2afc2)] p-2.5 shadow-[inset_0_2px_1px_white,0_12px_22px_#344c7244] sm:grid-cols-[6rem_minmax(0,1fr)] sm:rounded-l-[2.125rem] sm:p-4 sm:pr-5">
          <button
            aria-label={playing ? "Pause playback" : "Resume playback"}
            className="grid size-10 place-items-center justify-self-center rounded-full border border-[#163b95] bg-[linear-gradient(#477de4,#254cb8_51%,#193888_52%,#3072dc)] text-white shadow-[0_0_0_3px_#93a6c0,0_0_0_5px_#eef5ff,inset_0_2px_2px_#bde2ff,inset_0_-2px_4px_#09225e,0_6px_12px_#243a5d] enabled:hover:brightness-110 focus-visible:outline-offset-6 disabled:opacity-60 sm:size-16"
            disabled={!track}
            onClick={onTogglePlayback}
            type="button"
          >
            <svg
              aria-hidden="true"
              className="size-5 sm:size-6"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d={playing ? "M5 4h5v16H5zm9 0h5v16h-5z" : "M8 4v16l12-8z"} />
            </svg>
          </button>
          <div className="min-w-0">
            <div className="flex min-h-13 items-center justify-between gap-2 rounded-lg border border-[#192e5a] bg-[linear-gradient(174deg,#21488f,#0e2256_58%)] px-2.5 py-2 text-[#d8f8ff] shadow-[inset_0_2px_6px_#050d2acc,0_1px_white] sm:min-h-16 sm:px-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold sm:text-base">
                  {track?.title ?? "Nothing playing"}
                </p>
                <p className="truncate text-xs">{track?.artist ?? "Choose a track to start."}</p>
              </div>
              {track && (
                <span
                  aria-label="Playback time"
                  className="shrink-0 font-mono text-sm tabular-nums sm:text-base"
                >
                  {formatTime(currentTime)}
                  <small className="hidden sm:inline">
                    {" "}
                    / {duration ? formatTime(duration) : "--:--"}
                  </small>
                </span>
              )}
            </div>
            <div className="mt-1 flex min-w-0 items-center gap-3">
              <input
                aria-label="Seek"
                aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
                className="h-8 min-w-0 flex-1 accent-[#254cb8] disabled:opacity-50"
                disabled={!duration}
                max={duration || 1}
                min={0}
                onChange={(event) => onSeek(event.currentTarget.valueAsNumber)}
                step="any"
                type="range"
                value={Math.min(currentTime, duration)}
              />
              <label className="flex items-center gap-1">
                <svg
                  aria-hidden="true"
                  className="size-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M3 9v6h4l5 4V5L7 9H3zm13 0a4 4 0 010 6m2-9a8 8 0 010 12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                  />
                </svg>
                <input
                  aria-label="Volume"
                  aria-valuetext={`${Math.round(volume * 100)}%`}
                  className="h-8 w-11 accent-[#254cb8] sm:w-20"
                  max={1}
                  min={0}
                  onChange={(event) => onVolumeChange(event.currentTarget.valueAsNumber)}
                  step={0.05}
                  type="range"
                  value={volume}
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
