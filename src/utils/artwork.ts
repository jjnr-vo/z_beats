import { type Artwork , artworkClasses } from "@/shared/artwork";

const artworks = Object.keys(artworkClasses) as Artwork[];

export function getRandomArtwork(): Artwork {
  return artworks[Math.floor(Math.random() * artworks.length)];
}
