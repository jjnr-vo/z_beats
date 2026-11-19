import Link from "next/link";
import type { ReactNode } from "react";

import { signOutAction } from "./actions";
import { requireUser } from "@/lib/auth";

export const instant = false;

export default async function ProtectedLayout({ children }: Readonly<{ children: ReactNode }>) {
  const user = await requireUser();

  return (
    <div className="min-h-dvh bg-[radial-gradient(ellipse_at_63%_25%,#f1f7ff,#d3dfed_59%,#afc1d9)] bg-fixed font-[Tahoma,Verdana,sans-serif] text-[#11254a] [&_:focus-visible]:outline-[#254cb8]">
      <header>
        <div className="mx-auto flex w-full max-w-[66.5rem] items-center justify-between gap-4 px-4 py-6 sm:py-10">
          <Link
            aria-label="z_beats library"
            className="inline-flex items-center gap-3 rounded-sm"
            href="/dashboard"
          >
            <svg
              aria-hidden="true"
              className="size-8 rounded-lg bg-[#254cb8] p-1.5 text-white shadow-[inset_0_1px_2px_#fff8,0_2px_3px_#11254a55]"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                d="M2 12h4l3-6 4 12 3-9 2 3h4"
                stroke="currentColor"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
            <span className="text-xl font-bold tracking-tight">Z Beats</span>
          </Link>

          <div className="flex items-center gap-3 sm:gap-5">
            <span className="hidden max-w-56 truncate text-sm text-[#435773] sm:inline">
              {user.email}
            </span>
            <form action={signOutAction}>
              <button
                className="rounded-full border border-[#7288a7] px-4 py-2 text-sm font-medium hover:bg-white/70"
                type="submit"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[66.5rem] px-4 pb-[calc(14rem+env(safe-area-inset-bottom))]">
        {children}
      </main>
    </div>
  );
}
