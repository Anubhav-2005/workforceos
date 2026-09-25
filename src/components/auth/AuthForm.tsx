"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";

type Mode = "sign-in" | "sign-up";

type SessionResponse = {
  authenticated?: boolean;
  configured?: boolean;
};

const inputClassName =
  "mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

export default function AuthForm({ mode }: { mode: Mode }) {
  const isSignUp = mode === "sign-up";
  const [name, setName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function checkSession() {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store", signal: controller.signal });
        if (!response.ok) return;
        const session: SessionResponse = await response.json();
        if (session.authenticated) {
          window.location.replace("/dashboard");
          return;
        }
        if (typeof session.configured === "boolean") setConfigured(session.configured);
      } catch {
        // The submit action reports a useful error if the auth service is unavailable.
      }
    }

    void checkSession();
    return () => controller.abort();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError("");
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isSignUp
            ? {
                name: name.trim(),
                email: email.trim().toLowerCase(),
                password,
                organizationName: organizationName.trim(),
              }
            : { email: email.trim().toLowerCase(), password },
        ),
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
            ? payload.error
            : "We could not complete your request. Please try again.";
        setError(message);
        return;
      }

      window.location.replace("/dashboard");
    } catch {
      setError("Could not reach WorkforceOS. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[390px]">
      <p className="text-xs font-semibold tracking-[0.15em] text-indigo-600 uppercase">
        {isSignUp ? "Create your workspace" : "Welcome back"}
      </p>
      <h2 className="mt-2 text-3xl font-bold tracking-[-0.045em] text-slate-900">
        {isSignUp ? "Start your AI workforce" : "Sign in to WorkforceOS"}
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        {isSignUp
          ? "Set up a workspace for your team and start with a focused task."
          : "Pick up where your team left off."}
      </p>

      {configured === false && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Account sign-in is not configured here.</p>
          <p className="mt-1 text-xs leading-5 text-amber-800">
            You can still explore a clearly labeled demo workspace on this installation.
          </p>
          <Link
            href="/dashboard"
            className="mt-2 inline-flex items-center gap-1 text-xs font-bold underline underline-offset-2"
          >
            Open demo workspace <ArrowRight size={13} />
          </Link>
        </div>
      )}

      <form onSubmit={submit} className="mt-7 space-y-4">
        {isSignUp && (
          <>
            <label className="block text-xs font-semibold text-slate-700">
              Full name
              <input
                required
                autoComplete="name"
                maxLength={80}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                className={inputClassName}
              />
            </label>
            <label className="block text-xs font-semibold text-slate-700">
              Workspace name
              <input
                required
                autoComplete="organization"
                maxLength={80}
                value={organizationName}
                onChange={(event) => setOrganizationName(event.target.value)}
                placeholder="Your team or company"
                className={inputClassName}
              />
            </label>
          </>
        )}

        <label className="block text-xs font-semibold text-slate-700">
          Work email
          <input
            required
            type="email"
            autoComplete="email"
            maxLength={254}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
            className={inputClassName}
          />
        </label>

        <label className="block text-xs font-semibold text-slate-700">
          Password
          <span className="relative block">
            <input
              required
              type={passwordVisible ? "text" : "password"}
              autoComplete={isSignUp ? "new-password" : "current-password"}
              minLength={isSignUp ? 8 : undefined}
              maxLength={128}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={isSignUp ? "At least 8 characters" : "Enter your password"}
              className={`${inputClassName} pr-11`}
            />
            <button
              type="button"
              onClick={() => setPasswordVisible((value) => !value)}
              aria-label={passwordVisible ? "Hide password" : "Show password"}
              className="absolute top-1/2 right-3 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
            >
              {passwordVisible ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </span>
        </label>

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs leading-5 text-rose-700"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || configured === false}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? <LoaderCircle size={16} className="animate-spin" /> : null}
          {submitting ? "Please wait..." : isSignUp ? "Create workspace" : "Sign in"}
          {!submitting && <ArrowRight size={16} />}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-500">
        {isSignUp ? "Already have a workspace?" : "New to WorkforceOS?"}{" "}
        <Link href={isSignUp ? "/sign-in" : "/sign-up"} className="font-semibold text-indigo-600 hover:text-indigo-800">
          {isSignUp ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}
