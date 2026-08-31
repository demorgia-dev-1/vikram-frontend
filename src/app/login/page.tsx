"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  MailIcon,
  PlaneIcon,
} from "@/components/icons";
import { Button, ErrorNote, inputClass, labelClass } from "@/components/ui";
import { useAppDispatch, useAppSelector } from "@/store";
import { loginUser } from "@/store/authSlice";

const FEATURES = [
  "Add parts and raise service requests",
  "Track delivery and repair status live",
  "Maintenance history and certificates on file",
];

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = await dispatch(loginUser(form));

    if (loginUser.fulfilled.match(result)) {
      router.replace("/dashboard");
    }
  }

  return (
    <div className="flex flex-1 flex-col lg:grid lg:grid-cols-[1.1fr_1fr]">
      <BrandPanel />

      <section className="flex flex-1 items-center justify-center bg-white px-6 py-12 dark:bg-slate-950">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-600 text-white shadow-sm shadow-sky-600/25">
              <PlaneIcon className="h-5 w-5" />
            </span>
            <span className="text-base font-semibold tracking-tight">
              Vikram Aviation
            </span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Sign in to manage your parts, orders and service requests.
          </p>

          <form onSubmit={handleSubmit} noValidate className="mt-8">
            <label htmlFor="email" className={labelClass}>
              Email
            </label>
            <div className="relative mt-1.5">
              <MailIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                required
                value={form.email}
                onChange={handleChange}
                disabled={loading}
                className={`${inputClass} pl-10`}
              />
            </div>

            <div className="mt-5 flex items-baseline justify-between">
              <label htmlFor="password" className={labelClass}>
                Password
              </label>
              <a
                href="#"
                className="text-xs font-medium text-sky-600 transition hover:text-sky-500 dark:text-sky-400"
              >
                Forgot password?
              </a>
            </div>
            <div className="relative mt-1.5">
              <LockIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                required
                value={form.password}
                onChange={handleChange}
                disabled={loading}
                className={`${inputClass} pl-10 pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? (
                  <EyeOffIcon className="h-4 w-4" />
                ) : (
                  <EyeIcon className="h-4 w-4" />
                )}
              </button>
            </div>

            {error ? (
              <div className="mt-5">
                <ErrorNote message={error} />
              </div>
            ) : null}

            <Button type="submit" loading={loading} className="mt-6 w-full">
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-400 dark:text-slate-500">
            New customer? Contact us to request portal access.
          </p>
        </div>
      </section>
    </div>
  );
}

function BrandPanel() {
  return (
    <aside className="relative hidden overflow-hidden bg-slate-950 lg:flex lg:flex-col lg:justify-between lg:p-12">
      {/* Ambient glow + faint grid, drawn with gradients so there are no image assets. */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(60rem 40rem at 15% 0%, rgba(2,132,199,0.35), transparent 60%), radial-gradient(45rem 35rem at 100% 100%, rgba(56,189,248,0.18), transparent 55%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(70% 60% at 50% 40%, black, transparent)",
          WebkitMaskImage: "radial-gradient(70% 60% at 50% 40%, black, transparent)",
        }}
      />

      <div className="relative flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-600 text-white shadow-lg shadow-sky-600/25">
          <PlaneIcon className="h-5 w-5" />
        </span>
        <span className="text-lg font-semibold tracking-tight text-white">
          Vikram Aviation
        </span>
      </div>

      <div className="relative max-w-md">
        <h2 className="text-4xl font-semibold leading-tight tracking-tight text-white">
          Every part,
          <br />
          tracked end to end.
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-slate-300">
          Submit your aircraft parts for delivery, repair and maintenance — then
          follow each one from pickup to return in a single portal.
        </p>

        <ul className="mt-8 space-y-3">
          {FEATURES.map((item) => (
            <li key={item} className="flex items-center gap-3 text-sm text-slate-300">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-500/15 text-sky-400">
                <CheckIcon className="h-3 w-3" />
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <p className="relative text-xs text-slate-500">
        © {new Date().getFullYear()} Vikram Aviation. All rights reserved.
      </p>
    </aside>
  );
}
