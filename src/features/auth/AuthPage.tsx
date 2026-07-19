import { useState } from "react";
import { Button, Field, Input } from "@/design-system";
import { useAuthStore } from "@/stores/auth.store";

type Mode = "signin" | "signup";

export function AuthPage() {
  const [mode, setMode] = useState<Mode>("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const error = useAuthStore((s) => s.error);

  const isSignup = mode === "signup";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignup) await register(name, email, password);
      else await login(email, password);
    } catch {
      // error surfaced via store
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-sm animate-scale-in">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
            <div className="h-4 w-4 rounded-[5px] bg-accent-fg" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Triage</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-fg-subtle">
            Tell Triage what's due.
            <br />
            Triage tells you what to work on.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {isSignup && (
            <Field label="Your name">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Rivera"
                autoComplete="name"
                required
              />
            </Field>
          )}
          <Field label="Email">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@school.edu"
              autoComplete="email"
              required
            />
          </Field>
          <Field label="Password">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={isSignup ? "new-password" : "current-password"}
              minLength={8}
              required
            />
          </Field>

          {error && <p className="text-[13px] text-danger">{error}</p>}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="w-full"
          >
            {isSignup ? "Create account" : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-[13px] text-fg-subtle">
          {isSignup ? "Already have an account?" : "New to Triage?"}{" "}
          <button
            onClick={() => setMode(isSignup ? "signin" : "signup")}
            className="font-medium text-accent hover:underline"
          >
            {isSignup ? "Sign in" : "Create one"}
          </button>
        </p>
      </div>
    </div>
  );
}
