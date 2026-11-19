import type { Track } from "@/shared/tracks";

export type LibraryTrack = Omit<Track, "fixtureId"> & {
  lastModified: string;
};
