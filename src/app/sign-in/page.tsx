import Link from "next/link";
import { SignInForm } from "./form";

export const instant = false;

type SignInPageProps = {
  searchParams: Promise<{
    error?: string;
    status?: string;
  }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const notice =
    params.status === "confirmed"
      ? "Email confirmed. You can now sign in."
      : params.status === "signed-out"
        ? "You have been signed out."
        : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 py-16 text-zinc-50">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30 backdrop-blur">
        <div className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-zinc-400">
            z_beats auth shell
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Sign in to your beta workspace</h1>
          <p className="text-sm leading-6 text-zinc-300">
            Use the manually provisioned beta account to access the protected dashboard.
          </p>
        </div>

        {params.error ? (
          <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">
            {params.error}
          </div>
        ) : null}

        <div className="mt-8">
          <SignInForm notice={notice} />
        </div>

        <div className="mt-6 text-sm text-zinc-400">
          Need to go back?{" "}
          <Link className="font-medium text-emerald-300 hover:text-emerald-200" href="/">
            Return to the project home
          </Link>
        </div>
      </div>
    </main>
  );
}
