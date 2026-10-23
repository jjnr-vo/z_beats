"use server";

import { redirect } from "next/navigation";

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

export type SignInFormState = {
  message?: string;
  success?: string;
  fieldErrors?: {
    email?: string;
    password?: string;
  };
};

export async function signInAction(
  _previousState: SignInFormState,
  formData: FormData,
): Promise<SignInFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const fieldErrors: SignInFormState["fieldErrors"] = {};

  if (!email) {
    fieldErrors.email = "Email is required.";
  } else if (!email.includes("@")) {
    fieldErrors.email = "Enter a valid email address.";
  }

  if (!password) {
    fieldErrors.password = "Password is required.";
  }

  if (fieldErrors.email || fieldErrors.password) {
    return { fieldErrors };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      message: error.message,
    };
  }

  redirect("/dashboard");
}
