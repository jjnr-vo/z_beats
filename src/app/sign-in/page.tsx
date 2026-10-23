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
    <main className="flex min-h-screen items-center justify-center bg-[#f3f4f0] px-5 py-12 text-[#172a38] sm:px-6">
      <div className="w-full max-w-md rounded-2xl border border-[#d8dfdc] bg-[#fafbf8] p-7 shadow-[0_20px_60px_rgba(23,42,56,0.08)] sm:p-9">
        <div className="space-y-3">
          <p className="text-sm font-medium text-[#687981]">
            Your music, kept close.
          </p>
          <h1 className="text-3xl font-semibold tracking-[-0.055em]">
            Sign in to your library
          </h1>
          <p className="text-sm leading-6 text-[#52656d]">
            Use your private z_beats account to return to your collection.
          </p>
        </div>

        {params.error ? (
          <div className="mt-6 rounded-lg border border-[#d9b0a2] bg-[#fff8f5] px-4 py-3 text-sm text-[#7e3825]">
            {params.error}
          </div>
        ) : null}

        <div className="mt-8">
          <SignInForm notice={notice} />
        </div>
      </div>
    </main>
  );
}
