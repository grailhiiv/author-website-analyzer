"use client";

import { useActionState } from "react";
import { AlertCircleIcon, LogInIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
        <Alert variant="destructive">
          <AlertCircleIcon data-icon="inline-start" />
          <AlertTitle>Sign in failed</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2 rounded-lg border border-dashed bg-muted/20 p-3">
        <label className="text-sm font-medium" htmlFor="admin-email">
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

      <div className="flex flex-col gap-2 rounded-lg border border-dashed bg-muted/20 p-3">
        <label className="text-sm font-medium" htmlFor="admin-password">
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
        <LogInIcon data-icon="inline-start" />
        {isPending ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
