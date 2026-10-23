import type { Dispatch, SetStateAction } from "react";

import { artworkClasses } from "@/shared/artwork";
import type { Track } from "@/shared/tracks";

export function LibraryView({
  loadingTrackId,
  playTrack,
  query,
  setQuery,
  setSort,
  sort,
  visibleTracks,
}: {
  loadingTrackId: number | null;
  playTrack(track: Track): Promise<void>;
  query: string;
  setQuery: Dispatch<SetStateAction<string>>;
  setSort: Dispatch<SetStateAction<string>>;
  sort: string;
  visibleTracks: Track[];
}) {
  return (
    <section aria-labelledby="library-title">
      <div className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
        <p aria-live="polite" className="text-sm text-[#687981]">
          {visibleTracks.length} sample {visibleTracks.length === 1 ? "track" : "tracks"}
        </p>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <label className="relative flex-1 sm:w-80">
            <span className="sr-only">Search your library</span>
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#687981]"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle cx="10.8" cy="10.8" r="6.8" stroke="currentColor" strokeWidth="1.7" />
              <path
                d="m16 16 4.2 4.2"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.7"
              />
            </svg>
            <input
              className="h-11 w-full rounded-lg border border-[#cbd5d1] bg-white/70 pl-10 pr-4 text-sm text-[#172a38] placeholder:text-[#829096] focus:border-[#172a38]"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tracks, artists, albums"
              type="search"
              value={query}
            />
          </label>
          <label className="flex h-11 items-center gap-2 rounded-lg border border-[#cbd5d1] bg-white/70 px-3">
            <span className="sr-only">Sort tracks</span>
            <svg
              aria-hidden="true"
              className="size-4 shrink-0 text-[#687981]"
              fill="none"
              viewBox="0 0 20 20"
            >
              <path
                d="M4 5h12M6.5 10h7M8.5 15h3"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.5"
              />
            </svg>
            <select
              aria-label="Sort tracks"
              className="w-full bg-transparent text-sm text-[#344b58] outline-none"
              onChange={(event) => setSort(event.target.value)}
              value={sort}
            >
              <option value="added">Recently added</option>
              <option value="title">Title</option>
              <option value="artist">Artist</option>
              <option value="album">Album</option>
            </select>
          </label>
        </div>
      </div>

      <p className="mb-3 text-xs leading-5 text-[#687981]">
        Demo content for layout and playback testing. These sample tracks are not your personal
        collection.
      </p>
      <div className="overflow-hidden rounded-xl border border-[#d8dfdc] bg-[#fafbf8]">
        <table className="w-full table-fixed border-collapse text-left">
          <thead className="hidden border-b border-[#d8dfdc] text-xs font-medium text-[#687981] sm:table-header-group">
            <tr>
              <th className="w-[52%] px-5 py-3 font-medium" scope="col">
                Track
              </th>
              <th className="w-[28%] px-4 py-3 font-medium" scope="col">
                Album
              </th>
              <th className="w-[10%] px-4 py-3 text-right font-medium" scope="col">
                Length
              </th>
              <th className="w-[10%] px-4 py-3" scope="col">
                <span className="sr-only">Playback</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e9e6]">
            {visibleTracks.map((track) => (
              <tr className="group transition-colors hover:bg-[#f2f5f1]" key={track.id}>
                <th className="px-3 py-3 text-left font-normal sm:px-5" scope="row">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      aria-hidden="true"
                      className={`relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-md ${artworkClasses[track.artwork]}`}
                    >
                      <span className="absolute -right-2 -top-3 size-8 rounded-full border border-white/45" />
                      <span className="absolute -bottom-3 -left-2 size-9 rounded-full border border-white/55" />
                      <span className="relative size-3 rounded-full bg-white/65" />
                    </div>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-[#172a38]">
                        {track.title}
                      </span>
                      <span className="mt-1 block truncate text-xs text-[#687981]">
                        {track.artist}
                        <span className="sm:hidden"> · {track.album}</span>
                      </span>
                    </span>
                  </div>
                </th>
                <td className="hidden truncate px-4 py-3 text-sm text-[#52656d] sm:table-cell">
                  {track.album}
                </td>
                <td className="px-2 py-3 text-right font-mono text-xs tabular-nums text-[#687981] sm:px-4">
                  {track.duration}
                </td>
                <td className="px-3 py-3 text-right sm:px-4">
                  <button
                    aria-label={`${loadingTrackId === track.id ? "Loading" : "Play"} ${track.title} by ${track.artist}`}
                    className="inline-grid size-10 place-items-center rounded-full text-[#344b58] transition hover:bg-[#e8ede9] hover:text-[#172a38] disabled:cursor-wait disabled:opacity-50"
                    disabled={loadingTrackId !== null}
                    onClick={() => void playTrack(track)}
                    type="button"
                  >
                    {loadingTrackId === track.id ? (
                      <span
                        aria-hidden="true"
                        className="size-4 animate-spin rounded-full border-2 border-[#aebbb6] border-t-[#d46b43] motion-reduce:animate-none"
                      />
                    ) : (
                      <svg
                        aria-hidden="true"
                        className="size-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M6.2 4.7c0-.7.8-1.1 1.4-.7l8 5.3a.9.9 0 0 1 0 1.4l-8 5.3c-.6.4-1.4 0-1.4-.7V4.7Z" />
                      </svg>
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visibleTracks.length === 0 && (
          <div className="px-6 py-14 text-center">
            <h2 className="text-base font-medium text-[#172a38]">No matching tracks</h2>
            <p className="mt-2 text-sm text-[#687981]">Try another title, artist, or album name.</p>
          </div>
        )}
      </div>
    </section>
  );
}
