import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isPlaybackFixtureId } from "@/lib/playback";
import { createPlaybackAccess, PlaybackObjectNotFoundError } from "@/lib/r2";

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return json(
      { error: "Cross-origin playback requests are not allowed." },
      403,
    );
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error && ![400, 401, 403].includes(error.status ?? 0)) throw error;
    if (error || !user) {
      return json({ error: "Sign in again to load playback." }, 401);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return json({ error: "A JSON fixtureId is required." }, 400);
    }
    if (
      !body ||
      typeof body !== "object" ||
      !("fixtureId" in body) ||
      !isPlaybackFixtureId(body.fixtureId)
    ) {
      return json({ error: "Choose a known playback fixture." }, 400);
    }

    return json(await createPlaybackAccess(body.fixtureId));
  } catch (error) {
    if (error instanceof PlaybackObjectNotFoundError) {
      return json({ error: "This playback fixture is missing from R2." }, 404);
    }
    // Do not log SDK errors: they may contain signed URLs or request credentials.
    console.error("Playback URL issuance failed.");
    // console.error("Playback URL issuance failed.", {
    //   category: error instanceof Error ? error.message : "UnknownError",
    // });
    return json(
      {
        error:
          "Unable to load playback. Check the server R2 configuration and try again.",
      },
      503,
    );
  }
}
