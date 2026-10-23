import type { Track } from "@/shared/tracks";
import type { PlaybackAccess } from "@/utils/playback";

export type PlayerTrack = {
  track: Track;
  access: PlaybackAccess;
  generation: number;
};
