import type { Artwork } from "./artwork";
import type { PlaybackFixtureId } from "@/utils/playback";

export type Track = {
  id: number;
  title: string;
  artist: string;
  album: string;
  duration: string;
  fixtureId: PlaybackFixtureId;
  artwork: Artwork;
};

export const sampleTracks: Track[] = [
  {
    id: 1,
    title: "A Small Weather",
    artist: "Mara Vale",
    album: "Rooms for the Tide",
    duration: "3:42",
    fixtureId: "mp3",
    artwork: "blue",
  },
  {
    id: 2,
    title: "Glass Orchard",
    artist: "Mara Vale",
    album: "Field Notes",
    duration: "2:56",
    fixtureId: "m4a",
    artwork: "moss",
  },
  {
    id: 3,
    title: "Still, the River",
    artist: "Oren & June",
    album: "Soft Geometry",
    duration: "5:07",
    fixtureId: "long",
    artwork: "lilac",
  },
  {
    id: 4,
    title: "Almost Home",
    artist: "North Window",
    album: "Field Notes",
    duration: "3:31",
    fixtureId: "special",
    artwork: "coral",
  },
  {
    id: 5,
    title: "Blue Hour, Again",
    artist: "Oren & June",
    album: "Soft Geometry",
    duration: "4:02",
    fixtureId: "mp3",
    artwork: "blue",
  },
  {
    id: 6,
    title: "Cosmic Champagne",
    artist: "Daniel Fridell",
    album: "",
    duration: "3:38",
    fixtureId: "wav",
    artwork: "ochre",
  },
  {
    id: 7,
    title: "Make up Your Mind (Instrumental Version)",
    artist: "Relyae",
    album: "",
    duration: "02:58",
    fixtureId: "mp3",
    artwork: "ochre",
  },
];
