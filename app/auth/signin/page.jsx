"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import supabase from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

function SignInFormInner() {
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [errorMsg, setErrorMsg] = useState(null);
  const router = useRouter();
  const search = useSearchParams();
  const { toast } = useToast();

  const next = search.get("next") || null;

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (error) {
        // Normalize common Supabase errors
        const msg = String(error.message || "").toLowerCase();

        if (
          /invalid login credentials|invalid email or password|invalid_grant/.test(msg)
        ) {
          setErrorMsg("Incorrect email or password.");
          toast({
            title: "Sign in failed",
            description: "Incorrect email or password.",
            variant: "destructive",
          });
          return;
        }

        if (/email not confirmed|confirm your email|email_not_confirmed/.test(msg)) {
          setErrorMsg("Email not confirmed. Please check your inbox for the verification link.");
          toast({
            title: "Email not confirmed",
            description: "Check your inbox for the verification link, then try again.",
            variant: "destructive",
          });
          return;
        }

        // Fallback for any other auth error
        setErrorMsg(error.message || "Could not sign in.");
        toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
        return;
      }

      // Success
      if (next) {
        // honor guard-provided destination
        window.location.assign(next); // hard nav so server layout re-reads cookies
        return;
      }

      // Route by role as a fallback
      let role = String(data?.user?.user_metadata?.role || "").toUpperCase();
      if (!role) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();
        if (profile?.role) role = String(profile.role).toUpperCase();
      }

      window.location.assign(role === "INVESTOR" ? "/investor" : "/founder");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Sign in</CardTitle>
          <CardDescription className="text-center">Use your email and password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Your password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                required
                disabled={isLoading}
                minLength={8}
              />
            </div>

            {/* Inline error message */}
            {errorMsg && (
              <p className="text-sm text-red-600 text-center">{errorMsg}</p>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="text-center text-sm">
            Don’t have an account?{" "}
            <Link href="/auth/signup" className="text-primary hover:underline">
              Create one
            </Link>
          </div>

          <div className="text-center text-xs text-muted-foreground">
            Tip: If you see “Email not confirmed”, click the verification link we sent during signup.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <SignInFormInner />
    </Suspense>
  );
}
