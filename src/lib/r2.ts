import "server-only";

import { GetObjectCommand, HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import type { PlaybackAccess, PlaybackFixtureId } from "./playback";

const fixtureVariables: Record<PlaybackFixtureId, string> = {
  mp3: "R2_FIXTURE_MP3_KEY",
  wav: "R2_FIXTURE_WAV_KEY",
  aac: "R2_FIXTURE_AAC_KEY",
  m4a: "R2_FIXTURE_M4A_KEY",
  long: "R2_FIXTURE_LONG_KEY",
  special: "R2_FIXTURE_SPECIAL_KEY",
};

export class PlaybackObjectNotFoundError extends Error {}

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}. Configure R2 playback on the server.`);
  return value;
}

export async function createPlaybackAccess(fixtureId: PlaybackFixtureId): Promise<PlaybackAccess> {
  const accountId = requiredEnv("R2_ACCOUNT_ID");
  if (!/^[a-f0-9]{32}$/.test(accountId)) {
    throw new Error("R2_ACCOUNT_ID must be a 32-character hexadecimal account ID.");
  }

  const ttl = Number(process.env.R2_PLAYBACK_TTL_SECONDS ?? "900");
  if (!Number.isInteger(ttl) || ttl < 10 || ttl > 900) {
    throw new Error("R2_PLAYBACK_TTL_SECONDS must be an integer between 10 and 900.");
  }

  const bucket = requiredEnv("R2_BUCKET_NAME");
  const key = requiredEnv(fixtureVariables[fixtureId]);
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.eu.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requiredEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requiredEnv("R2_SECRET_ACCESS_KEY"),
    },
  });

  try {
    // Signing is local; check existence so missing fixtures fail before media loading.
    try {
      await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    } catch (error) {
      if (error instanceof Error && ["NotFound", "NoSuchKey"].includes(error.name)) {
        throw new PlaybackObjectNotFoundError("Playback fixture was not found.");
      }
      throw error;
    }

    const signingDate = new Date(Math.floor(Date.now() / 1000) * 1000);
    const url = await getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), {
      expiresIn: ttl,
      signingDate,
    });

    return {
      url,
      expiresAt: new Date(signingDate.getTime() + ttl * 1000).toISOString(),
    };
  } finally {
    client.destroy();
  }
}
