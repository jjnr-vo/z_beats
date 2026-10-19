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
    <div className="min-h-screen bg-[#f3f4f0] text-[#172a38]">
      <header className="border-b border-[#d8dfdc] bg-[#f3f4f0]/95">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link
            aria-label="z_beats library"
            className="inline-flex items-center gap-3 rounded-sm text-[#172a38] focus-visible:outline-[#d46b43]"
            href="/dashboard"
          >
            <span
              aria-hidden="true"
              className="grid size-9 place-items-center rounded-full bg-[#172a38] text-sm font-semibold tracking-tight text-[#f3f4f0]"
            >
              z
            </span>
            <span className="text-lg font-semibold tracking-[-0.06em]">z_beats</span>
          </Link>

          <div className="flex items-center gap-3 sm:gap-5">
            <span className="hidden max-w-56 truncate text-sm text-[#687981] sm:inline">
              {user.email}
            </span>
            <form action={signOutAction}>
              <button
                className="rounded-full border border-[#cbd5d1] px-4 py-2 text-sm font-medium text-[#344b58] transition hover:border-[#172a38] hover:bg-white"
                type="submit"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-5 pb-40 pt-8 sm:px-8 sm:pt-12">
        {children}
      </main>
    </div>
  );
}
