export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 py-16 text-zinc-50">
      <div className="w-full max-w-4xl rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl shadow-black/30 backdrop-blur">
        <div className="flex flex-col gap-10">
          <div className="space-y-4">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-zinc-400">
              z_beats private beta
            </p>
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              Next.js app scaffolded and ready for auth, sync, and playback
              work.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg">
              This bootstrap matches the approved beta plan: Next.js with the
              App Router, TypeScript, Tailwind CSS, and ESLint as the starting
              foundation for the z_beats web app.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <section className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <h2 className="text-lg font-semibold">Foundation</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-300">
                App Router, TypeScript, Tailwind CSS, and ESLint are configured
                and installed.
              </p>
            </section>
            <section className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <h2 className="text-lg font-semibold">Next build step</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-300">
                Wire Supabase auth, add protected routes, and validate the first
                end-to-end authentication flow.
              </p>
            </section>
            <section className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <h2 className="text-lg font-semibold">Execution docs</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-300">
                The engineering, PM, and EM planning artifacts remain in the
                repository for the next setup and implementation phases.
              </p>
            </section>
          </div>

          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-5 text-sm leading-6 text-emerald-100">
            Current milestone target: prove platform, auth, and storage
            feasibility before expanding into sync, catalogue browsing, and
            playback UX.
          </div>
        </div>
      </div>
    </main>
  );
}
