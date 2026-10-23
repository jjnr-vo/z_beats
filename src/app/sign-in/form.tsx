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
      className="inline-flex w-full items-center justify-center rounded-full bg-[#172a38] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#344b58] disabled:cursor-not-allowed disabled:opacity-70"
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
      className={`rounded-lg border px-4 py-3 text-sm ${
        tone === "error"
          ? "border-[#d9b0a2] bg-[#fff8f5] text-[#7e3825]"
          : "border-[#b8cec1] bg-[#eff6f0] text-[#315b43]"
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

  return <p className="text-sm text-[#9a3f2b]">{children}</p>;
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
        <label className="text-sm font-medium text-[#344b58]" htmlFor="email">
          Email
        </label>
        <input
          autoComplete="email"
          className="w-full rounded-lg border border-[#cbd5d1] bg-white px-4 py-3 text-sm text-[#172a38] outline-none transition placeholder:text-[#829096] focus:border-[#d46b43]"
          id="email"
          name="email"
          placeholder="you@example.com"
          type="email"
        />
        <FieldError>{state.fieldErrors?.email}</FieldError>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[#344b58]" htmlFor="password">
          Password
        </label>
        <input
          autoComplete="current-password"
          className="w-full rounded-lg border border-[#cbd5d1] bg-white px-4 py-3 text-sm text-[#172a38] outline-none transition placeholder:text-[#829096] focus:border-[#d46b43]"
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
