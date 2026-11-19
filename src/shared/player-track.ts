import type { Track } from "./tracks";
import type { PlaybackAccess } from "@/utils/playback";

export type PlayerTrack = {
  track: Pick<Track, "id" | "title" | "artist">;
  access: PlaybackAccess;
  generation: number;
};
