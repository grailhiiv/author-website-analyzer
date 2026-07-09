"use client";

import { useActionState } from "react";
import { AlertCircleIcon, LogInIcon } from "lucide-react";

import { Button } from "@/components/catalyst/button";
import { Input } from "@/components/catalyst/input";

import {
  signInAdminAction,
  type AdminLoginState,
} from "./actions";

const initialState: AdminLoginState = {};

export function AdminLoginForm() {
  const [state, formAction, isPending] = useActionState(
    signInAdminAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm/6 text-red-700">
          <div className="flex gap-3">
            <AlertCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
            <div>
              <p className="font-semibold">Sign in failed</p>
              <p className="mt-1">{state.error}</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-2 rounded-lg border border-zinc-950/10 bg-zinc-50/60 p-3">
        <label className="text-sm font-medium text-zinc-950" htmlFor="admin-email">
          Admin email
        </label>
        <Input
          id="admin-email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={state.email}
          placeholder="admin@example.com"
          required
        />
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-zinc-950/10 bg-zinc-50/60 p-3">
        <label className="text-sm font-medium text-zinc-950" htmlFor="admin-password">
          Password
        </label>
        <Input
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          minLength={8}
          required
        />
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        <LogInIcon data-slot="icon" />
        {isPending ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
