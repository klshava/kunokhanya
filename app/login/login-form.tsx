"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { signInAction, type AuthActionState } from "@/lib/actions/auth";

const initialState: AuthActionState = {};

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(signInAction, initialState);

  return (
    <Card>
      <CardContent className="p-6">
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email or Student Number</Label>
            <Input
              id="email"
              name="email"
              type="text"
              autoComplete="username"
              required
              placeholder="you@example.com or KTA170007"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="********"
            />
          </div>

          {state.error && (
            <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>
          )}

          <Button type="submit" variant="brand" size="lg" disabled={pending} className="mt-2">
            {pending ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
