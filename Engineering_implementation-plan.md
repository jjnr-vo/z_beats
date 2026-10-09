# z_beats engineering implementation plan

## 1. Executive implementation summary

Objective: reach a working beta foundation fast, in this order: convert plan to tasks, stand up services, prepare the representative library, then bootstrap implementation.

Execution stance:
- Keep scope locked to the approved beta cut
- Front-load integration risk: auth email delivery, R2 signed playback, metadata parsing
- Treat the first milestone as "platform + auth + storage feasibility proven"
- Build only what is needed for the one-user Sweden beta path

Immediate program tracks:
- Track A: service setup and secrets
- Track B: representative test library and acceptance fixtures
- Track C: repository/bootstrap and CI
- Track D: early technical proofs for playback, sync, and metadata

## 2. First 2 weeks engineering plan

### Week 1: planning conversion + service readiness
- Day 1: turn PM phases into engineering epics, milestones, owners, and task order
- Day 1-2: create Vercel project, Supabase project, SMTP account/domain setup, R2 bucket and scoped credentials
- Day 2: define environment variable contract across local/hosted environments
- Day 2-3: prepare representative library set:
  - 20-50 real tracks
  - synthetic unsupported/malformed files
  - one deletable file for sync removal validation
  - one long track for seek/resume
- Day 3-4: bootstrap repo standards:
  - Next.js app baseline
  - lint/typecheck/test/build pipeline
  - branch protection + deploy-on-main
- Day 4-5: define DB schema/migrations for users, tracks, albums, artists, sync_runs, ingestion_errors, playback_positions
- End-of-week exit: services live, secrets mapped, sample library ready, app skeleton deployable

### Week 2: auth baseline + early proofs
- Implement Supabase auth integration
- Enable email/password sign-in and email verification using custom SMTP
- Add protected app shell/routes
- Set up manual user provisioning and manual password reset runbook
- Run early technical proofs:
  - R2 signed URL generation
  - byte-range/seek behavior from browser
  - metadata extraction on representative files
- End-of-week exit: founder can sign in to deployed protected shell; email verification works; playback/storage feasibility is proven on sample files

## 3. Ordered engineering backlog for Weeks 1-4

### Week 1
1. Create engineering milestone structure from locked PM plan
2. Stand up Vercel beta project in `arn1`
3. Stand up Supabase project in `eu-north-1`
4. Configure SMTP sender/domain and auth email templates
5. Create R2 bucket in EU jurisdiction and scoped access keys
6. Define shared env var contract and secret naming
7. Prepare representative library fixture pack
8. Bootstrap Next.js repository structure
9. Configure CI: install, lint, typecheck, tests, build
10. Enable protected main branch and deployment flow

### Week 2
11. Integrate Supabase auth into Next.js
12. Implement sign-in/sign-out flow
13. Implement email verification flow
14. Add protected routes/app shell
15. Document manual provisioning/password reset operations
16. Create initial DB schema and migration workflow
17. Add error logging and uptime monitor baseline
18. Prove R2 presigned playback + browser seek/range support
19. Select metadata parsing library based on sample-file results
20. Define sync job API contract and result shape

### Week 3
21. Implement source object listing for one bucket/prefix
22. Implement supported-file filter: MP3/AAC/M4A
23. Implement sync diff logic for new/changed/deleted files
24. Implement metadata extraction pipeline
25. Implement artist/album/track upsert model
26. Persist sync_runs and ingestion_errors
27. Store artwork references/handling strategy
28. Add sync-now trigger endpoint and server action/job entrypoint
29. Add basic sync result UI/status view
30. Add integration tests for listing/filtering/diffing

### Week 4
31. Complete end-to-end manual sync path
32. Hide unsupported files from library and surface in sync results
33. Remove deleted source tracks from library on next sync
34. Normalize search/sort fields
35. Build basic browse views: artist/album/track
36. Add simple text search across core metadata
37. Harden failure handling/retry expectations
38. Validate sync against full representative library
39. Fix correctness/performance issues found in real sample data
40. Freeze Milestone 1 acceptance review

## 4. External service setup checklist

### Vercel
- Create project linked to repository
- Confirm deployment region: `arn1`
- Configure production environment only for beta
- Add env vars for Supabase, SMTP-related app config, R2, logging
- Verify deploy-on-main
- Configure preview deploys only if free/low-friction
- Add uptime target URL
- Document rollback to previous deployment

### Supabase
- Create project in `eu-north-1`
- Enable email/password auth
- Require email verification
- Disable public signup if not needed for beta flow
- Set redirect URLs for Vercel domain
- Configure SMTP for auth emails
- Define initial schema + migration path
- Create least-privilege app roles/policies needed for beta
- Document manual user invite/provisioning steps
- Document admin-triggered password reset procedure

### SMTP
- Choose lowest-friction provider with reliable EU delivery
- Verify sender domain and DNS
- Configure SPF/DKIM/DMARC minimum viable setup
- Add SMTP credentials to Supabase
- Send and receive test verification email
- Confirm email subject/from/reply-to settings
- Save deliverability troubleshooting steps

### Cloudflare R2
- Create bucket in EU jurisdiction
- Define stable source prefix
- Upload representative library
- Create scoped access key for app sync/read use
- Confirm S3-compatible endpoint details
- Validate object listing under prefix
- Validate presigned URL generation
- Validate byte-range requests and seek behavior from browser
- Confirm unsupported files can coexist under prefix without breaking sync

## 5. Repository/bootstrap checklist

- Initialize or confirm Next.js app structure
- Decide TypeScript, lint, formatter, test runner, and end-to-end runner
- Add env validation pattern
- Add migration workflow and schema ownership convention
- Add CI workflow: install, lint, typecheck, tests, build
- Add minimal error logging integration
- Add health/uptime endpoint or target route
- Create README sections:
  - setup
  - env vars
  - deployment
  - beta operating procedures
- Create issue labels/milestones matching Weeks 1-4
- Protect main branch
- Define definition-of-done for beta tasks
- Add seed/dev fixture approach for representative library metadata testing

## 6. Technical proof-of-concept checkpoints to de-risk early

### POC 1: auth email delivery
- Verification email sends from Supabase via custom SMTP
- Link lands on correct Vercel environment
- Verified user can complete sign-in

### POC 2: R2 protected playback
- App can generate short-lived signed URL
- Browser can stream file without exposing permanent credentials
- Range requests work for seek/scrub
- Chrome, Safari desktop, and Safari iPhone pass

### POC 3: metadata extraction quality
- Parser correctly reads title/artist/album/track number/duration/artwork on sample files
- Failure cases are captured as ingestion errors, not silent drops

### POC 4: sync diff correctness
- New file imports
- Changed file updates
- Deleted file disappears from library on next sync
- Unsupported file is hidden but reported in sync results

### POC 5: resume persistence behavior
- Position saves on pause/end/navigation
- Resume starts near last saved point
- Save frequency is throttled enough to avoid noisy writes

## 7. Acceptance criteria for the first implementation milestone

Milestone name: Platform + auth + storage feasibility complete

Must be true:
- Vercel, Supabase, SMTP, and R2 are configured and documented
- App deploys successfully from main
- CI passes on every merge
- Founder user can be manually provisioned
- Email verification works end-to-end in deployed environment
- Protected route enforcement works
- Representative library is prepared and accessible in R2
- Signed playback URL works on at least one supported file
- Browser seek/range behavior is confirmed on approved browsers
- Metadata parser is selected and validated against sample files
- Manual password reset procedure is documented and tested once

## 8. Risks that could block implementation immediately

- SMTP domain/DNS verification delays
- Supabase auth redirect/email template misconfiguration
- R2 presigned URL or range-request incompatibility with Safari
- Sample library not ready early enough to drive real validation
- Metadata parser failing on real-world tags/artwork variants
- Unclear env/secret ownership across local and hosted setup
- Scope drift into playlists, admin tooling, or unsupported formats before sync/playback core is proven

## 9. Recommended first coding task after setup is complete

Implement the end-to-end auth shell first:
- Supabase auth wiring in Next.js
- sign-in/sign-out
- email verification callback handling
- protected routes/layout
- manual user provisioning support
- basic signed-in app shell

Why first: it unlocks every later server action safely, validates the deployed stack quickly, and establishes the security boundary before sync and playback work.
