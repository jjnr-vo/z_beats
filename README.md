# z_beats

z_beats is a private beta web app for syncing a founder-managed music library,
browsing catalogue metadata, and streaming supported tracks in the browser.

This repository is now bootstrapped with [Next.js](https://nextjs.org), using:

- App Router
- TypeScript
- Tailwind CSS
- ESLint

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Debugging in VS Code

Configure your local `.env` using [.env.example](./.env.example), then open
**Run and Debug** and select a configuration from
[.vscode/launch.json](./.vscode/launch.json):

- **Next.js: server-side** starts the dev server with server-side debugging.
- **Next.js: full stack (Chrome)** also opens a Chrome debugging session once the
  server reports its local URL, enabling client-side breakpoints.

Press **F5** to start. Next.js loads the environment files itself; no credentials
belong in the debug configuration. Stop any existing dev server for this workspace
before launching a debug session. Server code runs when you visit the relevant
page or call its endpoint, so trigger that request to hit a breakpoint.

Dependency installation and dev-server commands are also available in the Agents
Run button through [.vscode/tasks.json](./.vscode/tasks.json). Use the debug
configurations above, rather than the plain dev-server task, for breakpoints.

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm test
```

## Current Implementation Scope

The app includes Supabase authentication, a dashboard populated directly from an
R2 source listing, library search and sorting, and signed playback through a
native audio player. Source listing is not yet a persisted catalogue or sync
pipeline: audio tags, duration, and embedded artwork are not indexed.

The next implementation milestones are:

- complete deployed auth and R2 playback acceptance checks
- validate audio metadata parsing
- add a persisted catalogue and manual sync pipeline

Planning artifacts currently in the repo:

- [EM_technical-plan.md](./plans/EM_technical-plan.md)
- [PM_beta_execution_plan.txt](./plans/PM_beta_execution_plan.txt)
- [Engineering_implementation-plan.md](./plans/Engineering_implementation-plan.md)

## Repository Automation

### PR validation and merge protection

[PR validation](./.github/workflows/pr-validation.yml) runs on pull requests
targeting `main`, pushes to `main`, and merge-queue checks. It can also be
triggered manually from GitHub Actions.

The single **PR validation** job uses Node.js 24 and the committed npm lockfile
to run `npm ci`, `npm test`, `npm run lint`, `npm run build`, and
`npm run typecheck`. Tests are not allowed to
fail or be skipped. The build runs before the standalone type-check so Next.js
has generated its route types on a clean checkout. No Supabase or R2 credentials
are required: tests mock external services and CI does not run live playback
acceptance checks.

**The workflow alone does not block merges.** An administrator must configure
GitHub under **Settings > Rules > Rulesets** with an active branch ruleset for
`main` (or use **Settings > Branches > Branch protection rules**):

1. Require a pull request before merging.
2. Require status checks to pass and select **PR validation**, provided by
   GitHub Actions, after the workflow has run at least once.
3. Require branches to be up to date before merging (or use a merge queue).
4. Remove bypass permissions if all merges, including administrator merges,
   must pass validation.

If GitHub does not allow enforcement for this repository's visibility and plan,
the workflow still reports results but cannot itself enforce a merge block.
Keep the job name stable because the required-check setting refers to that name.
There are deliberately no path filters or draft-PR exclusions, which could leave
a required check missing. Superseded runs are cancelled when a branch is updated.
Repository settings are not changed by committing this workflow.

For dependency changes, run `npm install` and commit both
[package.json](./package.json) and [package-lock.json](./package-lock.json).
CI uses `npm ci` to reject a manifest/lockfile mismatch rather than silently
resolving new dependency versions.

GitHub Actions deletes same-repository feature branches after their pull
requests are closed, while leaving protected branches untouched.

## Auth Shell Setup

The protected application shell uses Supabase SSR.

Required environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Core auth routes:

- `/sign-in`
- `/auth/confirm`
- `/dashboard`

## R2 Source Library and Signed Playback

The dashboard lists supported objects from the configured R2 source and plays
the selected track using a native audio player. An authenticated
`POST /api/playback` with `{"key":"library/song.mp3"}` returns
`{"url":"https://...","expiresAt":"<ISO timestamp>"}` with `Cache-Control: no-store`.
The endpoint checks the user independently of the dashboard layout, verifies the
key against the current supported source listing, checks object existence, and
signs a GET request. Audio streams directly from R2, not through Vercel.

Fixture requests such as `{"fixtureId":"mp3"}` remain supported for playback
validation. The six configured fixture IDs are `mp3`, `wav`, `aac`, `m4a`,
`long`, and `special`. There is no persisted catalogue, sync pipeline, or
persistent resume state yet.

### Bucket and environment setup

1. Create a **private EU-jurisdiction** R2 bucket. Keep the public development URL
   and public custom-domain access disabled.
2. Create **Object Read only** credentials scoped to that bucket. These credentials
   must permit object listing and HEAD/GET; do not grant write access.
3. Upload authorized MP3, WAV, AAC, and M4A samples, including long tracks and
   special-character paths. Set appropriate object content types: `audio/mpeg`,
   `audio/wav`, `audio/aac`, and `audio/mp4`, respectively. Extensions alone do
   not establish codec compatibility.
4. Copy the entries in [.env.example](./.env.example) into local `.env` and Vercel's
   server environment. Never prefix R2 settings with `NEXT_PUBLIC_`.
5. Set `R2_ACCOUNT_ID`, `R2_BUCKET_NAME`, `R2_ACCESS_KEY_ID`, and
   `R2_SECRET_ACCESS_KEY`. Set `R2_SOURCE_PREFIX` to the exact key prefix to list,
   such as `library/`; leaving it empty lists the whole bucket. Prefixes are
   case-sensitive and should not be URL-encoded or include the bucket name.
   For fixture-based validation, set the six `R2_FIXTURE_*_KEY` values to exact
   object keys, including any prefix, spaces, or special characters; do not
   URL-encode them or use full URLs. A fixture without a configured key reports
   an error. Fixture variables are not needed for key-based library playback.
6. The client uses `https://<ACCOUNT_ID>.eu.r2.cloudflarestorage.com` and SDK
   region `auto`. This requires an EU-jurisdiction bucket, not merely a European
   location hint. Presigned playback uses the S3 API domain, not a custom domain.
7. Add the bucket CORS policy below, replacing the example deployed origin with
   the actual app origin. Origins must match scheme, host, and port exactly.

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://your-app.vercel.app"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["Range"],
    "ExposeHeaders": [
      "Accept-Ranges",
      "Content-Range",
      "Content-Length",
      "ETag"
    ],
    "MaxAgeSeconds": 300
  }
]
```

CORS is not authorization. The player uses anonymous cross-origin media requests;
the URL signature supplies storage access. A GET signature does not authorize a
HEAD request, even though HEAD is allowed by CORS.

`R2_PLAYBACK_TTL_SECONDS` defaults to 900 (15 minutes); supported values are
integers from 10 to 900. Use 10 temporarily for expiry tests. After access expires,
select the track's Play button in the library again to request a fresh URL.
This remounts the audio element and starts from the beginning; playback position
is not restored. Browser autoplay restrictions may require pressing Play in the
native player. There is no dedicated renewal button or automatic retry.

Presigned URLs are bearer tokens: anyone possessing one can fetch the object until
expiry. Sign-out prevents new issuance, not use of an existing URL. This is not
DRM and does not prevent a recipient from saving audio. Do not share or log signed
URLs, including screenshots of network requests. Server issuance failures log
only a generic message, not SDK request details.

### Source listing authentication

The dashboard verifies the current user and calls the server-only
`listSourceLibrary()` helper directly. Do not fetch the application's own API
from a Server Component: server-side fetches do not automatically forward the
browser's authentication cookies.

The `/api/track-listing` endpoint has been removed. Listing is performed directly
on the server after dashboard authentication, not through an HTTP API. Listing
failures propagate through dashboard rendering instead of returning listing JSON.
Never log authentication cookies when debugging this flow.

The full listing is passed to the library component. Supported objects are shown;
unsupported files are counted separately. Titles come from filenames, artist and
album are unknown, duration is unavailable, and artwork is randomly selected
from the placeholder palette rather than extracted from audio files. The default
sort uses R2's last-modified time, not a catalogue import date.
Extension classification continues to use `trackFormatFixtures` in
[src/utils/track-format.ts](./src/utils/track-format.ts). It currently also includes
the proof labels `long` and `special`; classification is only an extension check,
not validation of the file's actual format or browser compatibility.

Selecting a track posts its exact object `key` to `/api/playback`. After
authentication, the server verifies that the key exists in the current supported
source listing before issuing access. Fixture-based requests remain supported for
the playback proof. Listing the source on every playback request is a temporary
proof-stage approach; a persisted catalogue should eventually replace that lookup.

### Acceptance checks

Run `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build`. Automated
tests cover authentication, the fixture allowlist, signed URL properties,
configuration validation, source pagination, listing-based rendering and playback,
missing objects, safe failures, and player persistence while filtering.
They do **not** prove real R2 or browser codec/range compatibility.

Run the following against the deployed application and real R2 fixtures:

| Check                                                         | Expected result                                                                      |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Anonymous POST to `/api/playback`                             | JSON 401, no URL, no redirect                                                        |
| Signed-in request with unknown fixture ID                     | JSON 400, no URL                                                                     |
| Signed-in request with a key outside the supported source listing | JSON 404, no URL                                                                  |
| Signed-in dashboard load                                      | Source tracks appear; unsupported files are counted separately                       |
| Request from a different Origin                               | JSON 403                                                                             |
| Missing configured object                                     | JSON 404 and visible player error                                                    |
| Missing key/config or R2 permission failure                   | JSON 503 and visible player error                                                    |
| Object GET without signature                                  | Denied; bucket remains private                                                       |
| Signed GET with `Range: bytes=0-1023`                         | 206, correct `Content-Range`, exactly 1,024 bytes for a fixture larger than 1 KiB    |
| Allowed Origin sent on range request                          | Matching `Access-Control-Allow-Origin`; range headers exposed                        |
| All fixtures in Chrome desktop, Safari desktop, Safari iPhone | Metadata loads; play/pause and forward/backward seeks work                           |
| Fresh range request after a 10-second URL expires             | Denied; do not mistake cached/buffered playback for valid access                     |
| Select the track again after expiry or a long pause            | New URL issued; playback starts from the beginning, or explicit autoplay message     |
| Sign out, then request new playback access                    | 401; existing URL remains usable only until expiry                                   |
| Healthy-network playback start from Sweden                    | Record time from pressing Play to audible playback; proposed target <=3 seconds      |

Use browser network tools or a local HTTP client for the byte-range check. Send
an `Origin` header when checking CORS, and use GET rather than `curl -I` with a
GET-signed URL. For expiry, make a fresh uncached request rather than relying on
the player's existing buffer. An expired response may omit CORS headers, so the
player cannot reliably distinguish expiry from other media/network failures.

Record date, deployed commit, browser/device version, fixture codec, startup time,
and results here after running the live checks. **Live R2 and device acceptance
is pending; automated tests alone do not complete the storage-feasibility gate.**

Local verification on 2026-10-15: 36 automated tests, lint, TypeScript, and the
production build passed. A production-server smoke test with non-secret local
auth placeholders returned uncached 401 for anonymous signing and 403 for
cross-origin signing. Browser navigation from `/dashboard` reached `/sign-in`.
No authenticated R2 playback or device acceptance result is claimed by these checks.

Cloudflare references: [presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/),
[CORS](https://developers.cloudflare.com/r2/buckets/cors/), and
[EU jurisdiction endpoints](https://developers.cloudflare.com/r2/reference/data-location/).

## Next.js Reference

Useful documentation:

- [Next.js Documentation](https://nextjs.org/docs)
- [App Router Documentation](https://nextjs.org/docs/app)
- [Tailwind CSS](https://tailwindcss.com/docs)

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
