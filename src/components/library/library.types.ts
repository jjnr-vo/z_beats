import type { PlaybackAccess, PlaybackFixtureId } from "@/lib/playback";

export type Artwork = "ochre" | "blue" | "moss" | "lilac" | "coral";

export type Track = {
  id: number;
  title: string;
  artist: string;
  album: string;
  duration: string;
  fixtureId: PlaybackFixtureId;
  artwork: Artwork;
};

export type PlayerTrack = {
  track: Track;
  access: PlaybackAccess;
  generation: number;
};
