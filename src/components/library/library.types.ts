import type { PlaybackAccess } from "@/lib/playback";
import type { Track } from "@/shared/tracks";

export type PlayerTrack = {
  track: Track;
  access: PlaybackAccess;
  generation: number;
};
