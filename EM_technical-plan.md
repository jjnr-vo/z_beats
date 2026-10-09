# z_beats beta technical plan draft

## 1) Beta objective
Build a **private web app** for **Sweden-only beta use** that lets you:

1. sign in securely
2. manually sync a music library from one S3-compatible source
3. browse/search the synced catalogue by metadata
4. stream full tracks in-browser
5. resume each track from the last saved position

This plan assumes:
- **you are the only beta user initially**
- **you provide all music and have rights to use/stream it**
- **cost minimization is a constant constraint**
- **we optimize for reversible choices and fast delivery over long-term perfect architecture**

## 2) Decision / assumption log

### Confirmed
- Greenfield repo; no stack inferred from current code
- Sweden-only beta
- Lowest-cost bias
- Absolute lowest cost preferred; a small monthly subscription is acceptable if the trade-off is clearly better
- Provider direction locked for planning: **Option A**
- Web app first
- Public internet access with secure login
- Email/password auth
- Managed auth service
- Managed auth choice locked for planning: **Supabase + custom SMTP**
- Region strategy locked for planning: **Supabase Stockholm (`eu-north-1`)**, **Vercel Stockholm (`arn1`)**, **Cloudflare R2 EU jurisdiction (`eu`)**
- Manual account creation
- Email verification required
- Manual password reset locked for planning: **admin-triggered reset via Supabase workflow, with no separate self-service recovery flow beyond the standard verification email path**
- Provider subdomain acceptable initially
- You provide the music
- One S3-compatible source, one stable prefix/location
- Source storage choice locked for planning: **Cloudflare R2 from the start**
- Source storage is the source of truth
- Manual “Sync now”
- Metadata comes from embedded file metadata
- Show artwork when available
- Clean library view grouped by metadata
- Search/browse by artist/title/album
- No extra filters needed in beta
- Full in-app playback
- Streaming only, no offline mode
- Remember last playback position per track
- Beta browser support locked for planning: **latest Chrome and Safari on desktop, plus latest Safari on iPhone**
- Representative test library locked for planning: **20-50 real-world tracks from the founder's own collection plus a few synthetic edge-case files**
- Unsupported file handling locked for planning: **hide unsupported files from the normal library and report them in sync results**
- Initial support can be limited to browser-friendly formats
- Deletion behavior locked for planning: **deleted source tracks disappear from the user-facing library on the next sync and remain visible only in sync logs for troubleshooting**
- Prefer EU hosting/data where practical
- Single beta environment
- Brief deployment downtime acceptable
- Lightweight uptime/error monitoring only
- English-only UI acceptable

### Working assumptions
- Library size is **small-to-medium**
- Supported formats for beta: **MP3, AAC, M4A**
- Unsupported initially: FLAC and unusual codecs unless browser support is validated
- No playlists, curation, tagging, sharing, or analytics-heavy product work in beta

### Representative test library baseline
- **20-50 tracks** from the founder's real collection
- includes examples with:
  - clean metadata
  - messy/inconsistent metadata
  - embedded artwork
  - missing artwork
  - multiple tracks from at least 2-3 albums
  - special characters in names
  - at least one longer track for seek/resume testing
  - at least one track later removed from source to validate sync deletion
- supplemented by a few **synthetic edge-case files** for unsupported formats, malformed metadata, duplicate-looking names, and unusual artwork/path patterns

## 3) Recommended beta architecture

### Recommendation: lean managed web stack
Use a **managed web stack** with minimal infrastructure ownership.

### Proposed stack
- **Frontend/app runtime:** Next.js
- **Hosting:** Vercel
- **Auth + database:** Supabase
- **Auth email delivery:** custom SMTP
- **Source media storage:** Cloudflare R2
- **Locked region settings:** Supabase Stockholm (`eu-north-1`), Vercel Stockholm (`arn1`), Cloudflare R2 EU jurisdiction (`eu`)
- **Sync/parsing worker:** app-triggered server job
- **Monitoring:** lightweight uptime + error logging

### Why this stack
This is the most practical beta option because it gives us:
- low setup friction
- low initial engineering cost
- managed auth
- managed Postgres
- easy deployment
- simple secret management
- reversible choices if we outgrow it later

### Reversibility
This is a good beta architecture because the responsibilities are clean:
- auth can be replaced later
- DB can be migrated later
- hosting can change later
- source storage stays external and canonical

### Provider options and why

#### Option A — Recommended default
- **Vercel Hobby + Supabase Free + Cloudflare R2 + Sentry Developer**
- **Why:** lowest-friction managed setup for a Next.js beta, near-zero fixed monthly cost, Postgres remains portable, and R2 avoids normal internet egress charges for browser audio streaming.
- **Main caveat:** Supabase's default email delivery is not enough for real external verification emails, so custom SMTP should be configured if email verification stays in scope.
- **Planning status:** selected

#### Option B — Lowest long-run infrastructure cost
- **Cloudflare Pages/Workers Free + Supabase Free + Cloudflare R2 + Sentry Developer**
- **Why:** keeps app and media costs very low, and pairs naturally with R2.
- **Main caveat:** the Next.js deployment path is less standard than Vercel, so delivery risk is slightly higher for an 8-week greenfield beta.

#### Option C — Cleaner managed auth experience
- **Vercel Hobby + Clerk Hobby + Neon Free + Cloudflare R2 + Sentry Developer**
- **Why:** Clerk can simplify email/password flows and verification UX while Neon keeps the database portable.
- **Main caveat:** more moving parts and stronger lock-in on auth than Supabase.

#### Option D — Small paid upgrade for fewer free-tier surprises
- **Vercel Hobby + Supabase Pro + Cloudflare R2 + Sentry Developer**
- **Why:** same overall architecture as the default, but with fewer free-tier limits and less risk of service pausing.
- **Main caveat:** introduces an immediate monthly baseline cost, typically around the cost of the paid Supabase tier.

### Cost posture for beta
- **Ultra-lean beta:** roughly **EUR 0-10/month** if free tiers remain sufficient and usage is light
- **Lean but safer beta:** roughly **EUR 20-35/month** if we pay for one critical service to reduce operational friction
- **Comfortable small-production-like beta:** roughly **EUR 35-60/month** if we want more buffer on quotas and availability

### Why Cloudflare R2 is favored for storage
- audio streaming can make **egress** more expensive than raw file storage over time
- R2's **free internet egress** keeps streaming cost risk low
- it supports **S3-compatible presigned URLs**, which fit the planned secure browser playback model
- it can be configured with **EU jurisdiction**, which supports the Sweden/EU preference

### Why SMTP appears in the plan
- SMTP is the mechanism used to **send auth-related emails**
- it is needed here because the beta currently requires **email verification**
- it is not the authentication system itself; it is the delivery layer for verification and reset emails
- for this beta, SMTP should remain a small operational detail rather than a major cost center

## 4) High-level system design

### Components

#### A. Web client
Browser UI for:
- login
- catalogue browsing
- search
- playback
- manual sync trigger
- resume playback

#### B. Application backend
Server-side app functions for:
- auth/session enforcement
- sync orchestration
- metadata parsing pipeline kickoff
- signed/protected playback URL generation
- persistence of playback progress

#### C. Database
Stores only app state and indexed metadata, not the music files themselves.

#### D. Source storage integration
Reads from one S3-compatible bucket/prefix.

#### E. Background sync process
On manual trigger:
- list source objects
- compare to indexed state
- extract metadata/artwork
- upsert catalogue records
- remove deleted tracks
- record sync results/errors

## 5) Recommended functional beta scope

### In scope for beta

#### Authentication
- email/password login
- email verification
- one manually provisioned user
- protected app routes

#### Catalogue sync
- manual “Sync now”
- scan one bucket/prefix
- read embedded metadata from supported audio files
- extract artwork when available
- mirror source deletions

#### Library experience
- library home
- search
- browse by:
  - artist
  - album
  - track
- clean metadata-based presentation

#### Playback
- in-browser audio playback
- play/pause/seek
- next/previous within current visible list optional, but not required
- last-position resume per track

#### Reliability basics
- sync status visible
- failed syncs logged
- uptime checks
- error alerting/logging

## 6) Explicitly out of scope for beta
These should be treated as **post-beta unless later pulled in intentionally**:
- native mobile apps
- offline mode/downloads
- playlists
- tagging/curation tools
- multiple libraries/sources
- multi-user roles
- public sign-up
- self-service admin
- complex analytics
- recommendation engine
- Swedish localization
- zero-downtime deployment
- instant auto-sync/webhooks
- advanced DRM or licensing workflows
- external streaming catalogue/provider integrations

## 7) External catalogue / playback provider summary
You asked earlier to check catalogue/playback-provider options and summarize them. Based on the new direction, they are **not needed for beta**, because you will provide the music directly. Still, here is the strategic summary:

### A. External catalogue metadata providers
Use case: enrich/search standardized artist/album/track metadata beyond embedded file tags.

Typical option types:
1. **Open/community metadata sources**
   - cheaper
   - broader accessibility
   - variable completeness/consistency

2. **Commercial music metadata providers**
   - richer structured data
   - better support/completeness
   - higher cost
   - contract overhead

#### Recommendation for beta
**Do not integrate one yet.**
Use embedded metadata first. Revisit only if your source files are too inconsistent.

### B. Playback providers
Use case: stream licensed third-party catalogues.

Typical option types:
1. **Consumer streaming platform integrations**
   - often require user/provider accounts
   - licensing and playback restrictions
   - embed/API limitations

2. **Commercial playback/catalogue platforms**
   - stronger rights/commercial pathways
   - much higher cost/complexity

3. **Self-hosted playback of owned/licensed files**
   - cheapest for your case
   - highest control
   - relies on your own rights and source library quality

#### Recommendation for beta
**Use self-hosted playback from your provided music files.**
That is the clear lowest-cost and lowest-risk beta path.

## 8) Data model draft
We only need a small, practical schema.

### Core entities

#### users
- id
- email
- auth_provider_user_id
- created_at
- last_login_at

#### libraries
- id
- name
- source_type
- bucket
- prefix
- region/provider_hint
- created_at

#### sync_runs
- id
- library_id
- started_at
- completed_at
- status
- scanned_count
- imported_count
- updated_count
- removed_count
- error_count
- triggered_by_user_id

#### artists
- id
- normalized_name
- display_name
- sort_name

#### albums
- id
- artist_id nullable
- title
- normalized_title
- year nullable
- artwork_asset_ref nullable

#### tracks
- id
- library_id
- artist_id nullable
- album_id nullable
- source_object_key
- source_etag/version nullable
- title
- track_number nullable
- disc_number nullable
- duration_seconds nullable
- codec/container nullable
- bitrate nullable
- artwork_asset_ref nullable
- last_seen_sync_run_id
- is_available
- created_at
- updated_at

#### playback_positions
- id
- user_id
- track_id
- last_position_seconds
- updated_at

#### ingestion_errors
- id
- sync_run_id
- source_object_key
- error_code
- error_message
- created_at

### Notes
- Keep schema intentionally small
- Add normalized fields for search/sort
- Use source object key + version/etag where possible for change detection

## 9) Sync and ingestion flow

### Beta sync process
1. User clicks **Sync now**
2. Backend validates authenticated access
3. Backend enumerates objects under configured bucket/prefix
4. Filter to supported file types
5. Detect new/changed/deleted files
6. For new/changed files:
   - read metadata
   - extract embedded artwork if present
   - upsert artist/album/track rows
7. Mark removed files unavailable/delete from catalogue view
8. Save sync summary and surfaced errors
9. Show result in UI

### Beta simplifications
- manual trigger only
- one library only
- single serial sync process
- no distributed job system unless needed
- retry on next sync rather than over-engineered recovery logic

## 10) Playback architecture

### Recommended approach
- App never exposes raw permanent storage credentials
- Backend issues short-lived access for streaming
- Browser plays audio from temporary protected URLs

### Why
This keeps the system simpler and more secure than proxying all audio through the app server, which would increase bandwidth and hosting cost.

### Beta requirement
We must validate that the chosen source storage/provider supports:
- reliable signed URL access
- range requests / seeking
- browser playback compatibility
- acceptable latency from EU users

## 11) Security, privacy, and compliance

### Beta essentials
- managed auth for email/password
- email verification enabled
- secure password handling delegated to auth provider
- HTTPS everywhere
- protected routes
- least-privilege storage credentials
- short-lived signed playback URLs
- secret storage in managed platform env vars
- server-side authorization on sync and playback URL issuance
- basic rate limiting on auth-sensitive endpoints if available from provider/platform

### Privacy posture
- minimal personal data:
  - your email
  - auth/session data
  - playback position
- no heavy analytics
- no unnecessary behavioral tracking

### Compliance posture
Because this is Sweden-focused and EU-preferred:
- choose EU region for DB/auth if available
- minimize data collection
- document that uploaded/streamed music must be content you own or are authorized to use

### Post-beta hardening
- formal retention policy
- audit logs
- stronger abuse protection
- richer access controls
- data processing/legal review if users expand

## 12) Reliability, performance, observability

### Beta goals
- app is usable and responsive for a single-user private beta
- sync should complete reliably for small-to-medium libraries
- playback should start quickly on normal broadband

### Beta performance targets
- login flow works reliably
- search returns quickly on small-to-medium catalogue
- track playback starts within a few seconds on healthy network
- resume position save is near-immediate after pause/stop/navigation checkpoints

### Beta observability
- uptime monitor for main app URL
- error logging for:
  - failed syncs
  - failed login flows
  - playback URL generation failures
  - metadata parsing failures

### Post-beta hardening
- dashboards
- metrics
- tracing
- SLOs
- performance budgets by route
- queue-backed ingestion if scale demands it

## 13) Environments, CI/CD, deployment, operations

### Environments
#### Beta-essential
- **one hosted beta environment only**

#### Why
Cheapest and fastest path; acceptable because:
- one user
- small scope
- downtime acceptable
- no public signup

### Deployment
- Git-based deploy pipeline from repository
- protected main branch once implementation starts
- deploy on merge to main
- environment secrets managed in hosting/auth platforms

### CI
Minimum pipeline:
1. install dependencies
2. lint
3. type-check
4. unit/integration tests
5. build

### Operations
- manual user provisioning
- manual password reset
- manual sync trigger
- manual rollback via previous deployment
- backup expectations delegated to managed DB where possible

### Post-beta hardening
- separate staging
- preview environments
- automated DB migration safeguards
- blue/green or zero-downtime releases

## 14) Testing strategy

### Beta minimum test strategy
#### Unit tests
- metadata normalization helpers
- sync diff logic
- playback position persistence logic
- authorization guards

#### Integration tests
- auth-protected route behavior
- sync flow against mocked S3-compatible storage
- DB upsert logic
- signed playback URL issuance

#### End-to-end tests
- sign in
- trigger sync
- browse catalogue
- search track
- play track
- resume track from saved position

#### Manual acceptance checks
- email verification works
- deleted source file disappears after sync
- unsupported format is handled clearly
- artwork appears when embedded
- seek/resume behaves correctly

### Beta quality gates
A beta build is “ready” only if:
- auth works end-to-end
- sync works end-to-end on representative sample files
- playback works in supported browsers
- resume position works
- core pages build and deploy cleanly
- no critical/high security issues in chosen beta design
- error logging is active

## 15) Technical risks and mitigation

### Top risks
#### 1. Embedded metadata quality is inconsistent
**Risk:** poor browse/search experience  
**Mitigation:** beta relies on source cleanup + re-sync, not in-app metadata editing

#### 2. Audio format/browser compatibility
**Risk:** some files won’t play in-browser  
**Mitigation:** officially support only MP3/AAC/M4A in beta; fail clearly for unsupported files

#### 3. S3-compatible provider behavior differences
**Risk:** signing/range requests vary  
**Mitigation:** validate against chosen provider early with a playback proof of concept

#### 4. Email/password auth edge cases
**Risk:** login/reset/verification friction  
**Mitigation:** use managed auth, manual user/admin support in beta

#### 5. Scope creep
**Risk:** playlists/tags/mobile/multi-user slow delivery  
**Mitigation:** hold the beta line; defer non-essential features

#### 6. Resume persistence edge cases
**Risk:** position is saved too often or inaccurately  
**Mitigation:** checkpoint on pause/end/navigation + periodic throttled saves

## 16) Build-vs-buy decisions

### Buy / managed for beta
- authentication
- database hosting
- app hosting
- uptime monitoring
- error logging

### Build ourselves
- sync workflow
- metadata indexing
- library browsing UI
- playback experience
- playback position persistence

### Why
Security- and ops-heavy layers are better bought for beta. Product-differentiating workflows should be built.

## 17) Beta readiness checklist
We should not start implementation until this list is accepted as the working contract.

### Must be true before coding
- Beta scope approved
- Stack direction approved
- One source storage path confirmed
- One auth provider choice approved
- One hosting/DB region strategy approved
- Supported audio formats for initial test set identified
- You confirm representative sample files are available for development/testing

### Must be true before launch
- real source sync tested
- representative files play in-browser
- auth and email verification work
- deployment pipeline works
- monitoring works
- rollback path documented
- core acceptance tests pass

## 18) Suggested implementation sequence

### Phase 0 — confirm architecture
- approve this draft
- choose exact providers
- define supported file sample set
- define acceptance criteria

### Phase 1 — project bootstrap
- initialize app
- configure managed auth
- configure DB
- configure deployment
- set up CI

### Phase 2 — core auth and protected shell
- login flow
- verification flow
- protected app shell
- manual account provisioning

### Phase 3 — source integration and sync
- connect S3-compatible source
- manual sync trigger
- metadata extraction
- catalogue persistence
- sync reporting/errors

### Phase 4 — library UX
- artist/album/track browse
- search
- artwork display

### Phase 5 — playback
- protected streaming URL issuance
- browser player
- seek/play/pause
- resume position persistence

### Phase 6 — harden beta
- basic logging/monitoring
- representative e2e coverage
- launch checklist
- controlled beta release

## 19) Rough 8-week sequencing draft
Flexible, but realistic.

### Week 1
- finalize architecture and provider choices
- bootstrap repo/app
- set up CI/CD and environments

### Week 2
- auth integration
- protected routes
- account provisioning flow

### Week 3
- S3-compatible integration proof of concept
- metadata parser selection
- sync data model

### Week 4
- implement manual sync
- persist catalogue
- error handling

### Week 5
- library browsing/search UI
- artwork handling

### Week 6
- playback integration
- signed access
- resume position persistence

### Week 7
- testing pass
- bug fixing
- monitoring
- deployment hardening

### Week 8
- acceptance testing on real library
- polish
- beta readiness review
- release

## 20) Product decisions still needed from the Project Manager
These should become explicit PM tasks:
1. final naming of the beta scope/cuts against your “1,4,5,2,3” priority order
2. exact provider selection:
   - hosting
   - auth/DB
   - source storage vendor
3. actual supported browser list for beta
4. representative test library definition
5. future roadmap items deferred from beta:
   - tablets/desktops strategy
   - broader user access
   - non-Sweden expansion
   - analytics scope
   - playlists/tags/curation
   - metadata editing
   - multi-library support

## 21) Recommended next specialized agents

### 1. Research agent — next recommended
**Why now:** we are at the point where a concrete provider comparison is valuable.  
**What it should answer:** the cheapest viable combinations for:
- managed auth + DB
- EU-friendly hosting
- S3-compatible playback/signing compatibility
- operational simplicity

### 2. Project Manager agent — after provider direction is approved
**Why:** convert this plan and the deferred decisions into execution tasks and milestones.

## 22) My recommendation
If we hold the line on scope, the best beta plan is:

- **Next.js app**
- **Vercel hosting**
- **Supabase for auth + Postgres**
- **one S3-compatible source bucket/prefix**
- **manual sync**
- **metadata-based browse/search**
- **protected direct streaming**
- **resume per track**
- **single-user private beta**

That is the simplest credible path that satisfies the current product intent.
