import type { Dispatch, SetStateAction } from "react";

import type { LibraryTrack } from "./library.types";
import { artworkClasses } from "@/shared/artwork";

export function LibraryView({
  currentTrackId,
  totalTracks,
  unsupportedCount,
  loadingTrackId,
  playTrack,
  query,
  setQuery,
  setSort,
  sort,
  visibleTracks,
}: {
  currentTrackId?: string;
  totalTracks: number;
  unsupportedCount: number;
  loadingTrackId: string | null;
  playTrack(track: LibraryTrack): Promise<void>;
  query: string;
  setQuery: Dispatch<SetStateAction<string>>;
  setSort: Dispatch<SetStateAction<string>>;
  sort: string;
  visibleTracks: LibraryTrack[];
}) {
  return (
    <section aria-labelledby="library-title">
      <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p aria-live="polite" className="shrink-0 text-xs text-[#435773]">
          {visibleTracks.length} of {totalTracks} tracks
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
              className="h-10 w-full rounded-[0.3125rem] border border-[#98abc5] bg-[#f9fcff] pl-10 pr-3 text-sm shadow-[inset_0_1px_2px_#11254a22] placeholder:text-[#435773]"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tracks, artists, albums"
              type="search"
              value={query}
            />
          </label>
          <label className="flex h-10 items-center gap-2 rounded-[0.3125rem] border border-[#98abc5] bg-[#f9fcff] px-3 shadow-[inset_0_1px_2px_#11254a22]">
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
              className="w-full bg-transparent text-sm"
              onChange={(event) => setSort(event.target.value)}
              value={sort}
            >
              <option value="added">Recently modified</option>
              <option value="title">Title</option>
              <option value="artist">Artist</option>
              <option value="album">Album</option>
            </select>
          </label>
        </div>
      </div>

      <p className="mb-3 px-4 text-xs leading-5 text-[#435773] sm:px-6">
        Tracks from your source library. Titles use filenames; audio metadata is not indexed yet.
        {unsupportedCount > 0 && ` ${unsupportedCount} unsupported files excluded.`}
      </p>
      <div className="overflow-hidden rounded-b-[0.625rem]">
        <table className="w-full table-fixed border-collapse text-left">
          <thead className="hidden border-y border-[#c5d3e4] bg-[#e4ecf7] text-xs text-[#435773] sm:table-header-group">
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
          <tbody className="divide-y divide-[#c5d3e4]">
            {visibleTracks.map((track) => (
              <tr
                className="group hover:bg-[#e4ecf7] data-[current=true]:bg-[#254cb8] data-[current=true]:text-white"
                data-current={track.id === currentTrackId}
                key={track.id}
              >
                <th className="px-3 py-3 text-left font-normal sm:px-5" scope="row">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      aria-hidden="true"
                      className={`relative grid size-8 shrink-0 place-items-center overflow-hidden rounded ${artworkClasses[track.artwork]}`}
                    >
                      <span className="absolute -right-2 -top-3 size-8 rounded-full border border-white/45" />
                      <span className="absolute -bottom-3 -left-2 size-9 rounded-full border border-white/55" />
                      <span className="relative size-3 rounded-full bg-white/65" />
                    </div>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold">{track.title}</span>
                      <span className="block truncate text-xs text-[#435773] group-data-[current=true]:text-[#e4efff]">
                        {track.artist}
                        <span className="sm:hidden"> · {track.album}</span>
                      </span>
                    </span>
                  </div>
                </th>
                <td className="hidden truncate px-4 py-3 text-sm sm:table-cell">{track.album}</td>
                <td className="w-16 px-2 py-3 text-right font-mono text-xs tabular-nums text-[#435773] group-data-[current=true]:text-[#e4efff] sm:px-4">
                  {track.duration}
                </td>
                <td className="w-14 px-2 py-1 text-right sm:px-4">
                  <button
                    aria-label={`${loadingTrackId === track.id ? "Loading" : "Play"} ${track.title} by ${track.artist}`}
                    aria-current={track.id === currentTrackId ? "true" : undefined}
                    className="inline-grid size-10 place-items-center rounded hover:bg-[#254cb8]/10 focus-visible:outline-offset-0 disabled:cursor-wait disabled:opacity-50 group-data-[current=true]:hover:bg-white/15 group-data-[current=true]:focus-visible:outline-[#8deeff]"
                    disabled={loadingTrackId !== null}
                    onClick={() => void playTrack(track)}
                    type="button"
                  >
                    {loadingTrackId === track.id ? (
                      <span
                        aria-hidden="true"
                        className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none"
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
            <h2 className="text-base font-medium text-[#172a38]">
              {totalTracks === 0 ? "Your library is empty" : "No matching tracks"}
            </h2>
            <p className="mt-2 text-sm text-[#687981]">
              {totalTracks === 0
                ? "Add supported audio files to your configured R2 source."
                : "Try another title, artist, or album name."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
