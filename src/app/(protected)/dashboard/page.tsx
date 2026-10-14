import { requireUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-lg shadow-black/20">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-zinc-400">
          Signed in
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-50">
          Welcome back to the z_beats beta workspace
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-300 sm:text-base">
          This protected route proves the first auth milestone: Supabase SSR sessions are
          active, protected pages can enforce access, and the branch is ready for sync and
          playback infrastructure work.
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <h3 className="text-lg font-semibold text-zinc-50">Authenticated user</h3>
          <p className="mt-2 break-all text-sm leading-6 text-zinc-300">{user.email}</p>
        </section>
        <section className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <h3 className="text-lg font-semibold text-zinc-50">Next milestone</h3>
          <p className="mt-2 text-sm leading-6 text-zinc-300">
            Validate email confirmation end-to-end, then connect R2 signed playback and the
            first sync proof.
          </p>
        </section>
        <section className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <h3 className="text-lg font-semibold text-zinc-50">Session behavior</h3>
          <p className="mt-2 text-sm leading-6 text-zinc-300">
            Sessions are refreshed through the request proxy and protected routes redirect
            anonymous users back to sign in.
          </p>
        </section>
      </div>
    </div>
  );
}
