"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signInAction, type SignInFormState } from "./actions";

type SignInFormProps = {
  notice?: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex w-full items-center justify-center rounded-full bg-emerald-400 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
      disabled={pending}
      type="submit"
    >
      {pending ? "Signing in..." : "Sign in"}
    </button>
  );
}

function MessageBanner({
  children,
  tone,
}: {
  children: string;
  tone: "error" | "success";
}) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-sm ${
        tone === "error"
          ? "border-red-400/20 bg-red-400/10 text-red-100"
          : "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
      }`}
    >
      {children}
    </div>
  );
}

function FieldError({ children }: { children?: string }) {
  if (!children) {
    return null;
  }

  return <p className="text-sm text-red-200">{children}</p>;
}

export function SignInForm({ notice }: SignInFormProps) {
  const [state, formAction] = useActionState<SignInFormState, FormData>(
    signInAction,
    {},
  );

  return (
    <form action={formAction} className="space-y-5">
      {notice ? <MessageBanner tone="success">{notice}</MessageBanner> : null}
      {state.message ? <MessageBanner tone="error">{state.message}</MessageBanner> : null}

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-100" htmlFor="email">
          Email
        </label>
        <input
          autoComplete="email"
          className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-50 outline-none transition placeholder:text-zinc-500 focus:border-emerald-400/40"
          id="email"
          name="email"
          placeholder="you@example.com"
          type="email"
        />
        <FieldError>{state.fieldErrors?.email}</FieldError>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-100" htmlFor="password">
          Password
        </label>
        <input
          autoComplete="current-password"
          className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-50 outline-none transition placeholder:text-zinc-500 focus:border-emerald-400/40"
          id="password"
          name="password"
          placeholder="Enter your password"
          type="password"
        />
        <FieldError>{state.fieldErrors?.password}</FieldError>
      </div>

      <SubmitButton />
    </form>
  );
}
