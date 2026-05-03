"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { InputField } from "@/components/ui/input-field";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        setError(data.error?.message ?? "Authentication failed");
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <GlassCard>
      {/* Branding header */}
      <div className="p-8 pb-4 flex flex-col items-center border-b border-border">
        <div className="w-10 h-10 mb-4 flex items-center justify-center bg-primary-container rounded-xs shadow-lg border border-white/10">
          <span className="material-symbols-outlined text-white text-2xl">
            terminal
          </span>
        </div>
        <h1 className="font-[family-name:var(--font-label)] text-xs text-on-surface uppercase tracking-[0.2em]">
          AWF_SYSTEM_CORE
        </h1>
        <p className="text-on-surface-variant mt-2 text-center text-sm opacity-70">
          Automated Workflow Factory v2.4.0
        </p>
      </div>

      {/* Auth form area */}
      <div className="p-8 pt-6 flex flex-col gap-6">
        {/* SSO */}
        <Button variant="ghost" icon={<GitHubIcon />} type="button">
          Sign in with GitHub
        </Button>

        <Divider text="or email" />

        {/* Form */}
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <InputField
            label="Identifier"
            icon="alternate_email"
            type="email"
            autoComplete="username"
            placeholder="developer@awf.io"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <InputField
            label="Passkey"
            passwordVisibilityToggle
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            trailing={
              <span className="font-[family-name:var(--font-label)] text-[10px] text-primary hover:text-white transition-colors cursor-pointer">
                Recover Access
              </span>
            }
          />

          {error && (
            <p className="text-sm text-error">{error}</p>
          )}

          <Button
            type="submit"
            disabled={loading}
            icon={
              <span className="material-symbols-outlined text-sm">
                arrow_forward
              </span>
            }
            className="mt-2"
          >
            {loading ? "Authenticating..." : "Authenticate"}
          </Button>
        </form>
      </div>

      {/* Footer */}
      <div className="px-8 py-5 bg-footer/50 border-t border-border flex items-center justify-center">
        <p className="text-on-surface-variant text-xs">
          New operator?{" "}
          <span className="text-primary font-semibold cursor-pointer hover:underline">
            Initialize Account
          </span>
        </p>
      </div>
    </GlassCard>
  );
}

function GitHubIcon() {
  return (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}
