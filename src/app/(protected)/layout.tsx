import type { ReactNode } from "react";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { signOutAction } from "./actions";

export const instant = false;

export default async function ProtectedLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const user = await requireUser();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <header className="border-b border-white/10 bg-black/20 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-zinc-400">
              z_beats beta
            </p>
            <h1 className="text-lg font-semibold text-zinc-50">Protected dashboard</h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 sm:inline-flex">
              {user.email}
            </span>
            <Link
              className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:border-white/20 hover:bg-white/5"
              href="/"
            >
              Home
            </Link>
            <form action={signOutAction}>
              <button
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
                type="submit"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
