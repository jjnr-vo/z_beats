# Project Guidelines

## Conventions

### Branch naming

When creating a branch for this repository, use the following structure:

`<conventional-commit-type>/<kebab-case-issue-or-feature>`

Rules:

- Use a conventional commit type for the prefix, such as `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `build`, `ci`, or `perf`.
- Use lowercase `kebab-case` for the descriptive portion after the slash.
- Keep the descriptive portion short, specific, and issue- or feature-oriented.

Examples:

- `feat/auth-shell-infra-wiring`
- `fix/email-confirmation-redirect`
- `chore/delete-merged-pr-branches`

## Project structure

### File size and splitting

- Keep each file to roughly 200 lines of code or fewer. When a file approaches that limit, split it before adding more code.
- Keep components small and focused on one job. Pull out reusable pieces (buttons, cards, list rows, icons, hooks) into their own files so other features can import them.
- Prefer several small, named exports over one large component.

### Where code goes

- `src/app/`: Next.js App Router only. Keep route files here (`page.tsx`, `layout.tsx`, `route.ts`, `actions.ts`). Components used by a single route can sit next to that route, as `dashboard/playback-proof.tsx` does.
- `src/components/<feature>/`: UI grouped by feature. Reusable UI components that several features need go in a shared UI folder such as `src/components/ui/`, not in a feature folder.
- `src/shared/`: shareable non-UI code used by more than one feature: types, style maps, constants and sample data. Examples: `artwork.ts` (the `Artwork` type and `artworkClasses`) and `tracks.ts` (the `Track` type and `sampleTracks`). Add a new file per concept, not per feature. Shared UI components stay in `src/components/`.
- `src/lib/`: framework-agnostic logic with no React imports (auth, playback, storage, Supabase clients under `src/lib/supabase/`).
- `src/utils/`: small pure helpers that don't belong in `src/lib/` (create it when the first helper is needed).
- Keep tests next to the code they cover, named `<name>.test.ts` or `<name>.test.tsx`.

### Feature folder pattern

Follow the `src/components/library/` layout for each feature:

- `<feature>.tsx`: container. Holds state, data loading, effects and handlers.
- `<feature>.view.tsx`: presentational component. Receives props and renders markup, with no data fetching.
- `<feature>.types.ts`: types used only by this feature. Types another feature needs go in `src/shared/`.
- `<feature>.constants.ts`: static values and lookup tables used only by this feature. Anything another feature needs goes in `src/shared/`.
- `<feature>.test.tsx`: tests for the container and view.

Split out a `<feature>.<part>.tsx` file when a view grows past the size limit.

### Dependencies

- Components may import from other components, including another feature's component files.
- Do not import types, constants or sample data from another feature's `.types.ts` or `.constants.ts`. Move them to `src/shared/` and import them with the `@/shared/` alias.
- Avoid circular imports. If two features need each other, move the shared piece into `src/shared/`.
- `app/` may import from `components/`, `shared/` and `lib/`.
- `shared/` may import from `lib/`, but must not import from `components/` or `app/`.
- `lib/` must not import from `components/`, `app/` or `shared/`.

### Before finishing a change

- Run `npm run format`, `npm run lint`, `npm run typecheck` and `npm test`.
- Check that no touched file exceeds about 200 lines.

