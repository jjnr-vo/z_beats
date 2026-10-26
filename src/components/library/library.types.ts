import type { Track } from "@/shared/tracks";
import type { PlaybackAccess } from "@/utils/playback";

export type PlayerTrack = {
  track: LibraryTrack;
  access: PlaybackAccess;
  generation: number;
};

export type LibraryTrack = Omit<Track, "fixtureId"> & {
  lastModified: string;
};
