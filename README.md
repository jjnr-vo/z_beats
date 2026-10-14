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

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Current Bootstrap Scope

The initial scaffold establishes the frontend foundation approved during
planning. The next implementation milestone is:

- Supabase auth wiring
- protected routes and basic app shell
- Cloudflare R2 integration proof for secure playback access
- early metadata/sync feasibility validation

Planning artifacts currently in the repo:

- [EM_technical-plan.md](./plans/EM_technical-plan.md)
- [PM_beta_execution_plan.txt](./plans/PM_beta_execution_plan.txt)
- [Engineering_implementation-plan.md](./plans/Engineering_implementation-plan.md)

## Repository Automation

GitHub Actions deletes same-repository feature branches after their pull
requests are closed, while leaving protected branches untouched.

## Auth Shell Setup

The current branch adds the first protected application shell using Supabase SSR.

Required environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Core auth routes:

- `/sign-in`
- `/auth/confirm`
- `/dashboard`

## Next.js Reference

Useful documentation:

- [Next.js Documentation](https://nextjs.org/docs)
- [App Router Documentation](https://nextjs.org/docs/app)
- [Tailwind CSS](https://tailwindcss.com/docs)

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
