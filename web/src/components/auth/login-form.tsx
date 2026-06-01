"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { authApi } from "@/lib/api";
import { setAuthToken } from "@/lib/auth-token";
import { useAuth } from "@/hooks/useAuth";

type AuthFormProps = {
  mode?: "login" | "signup";
};

export function AuthForm({ mode: initialMode = "login" }: AuthFormProps) {
  const router = useRouter();
  const { login } = useAuth();
  const [mode, setMode] = React.useState<"login" | "signup">(initialMode);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    if (mode === "signup") {
      if (password !== confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
      if (password.length < 8) {
        toast.error("Password must be at least 8 characters");
        return;
      }
    }

    setIsLoading(true);

    try {
      const data =
        mode === "login"
          ? await authApi.login({ email, password })
          : await authApi.register({
              email,
              password,
              username: email.split("@")[0],
              full_name: "",
            });

      setAuthToken(data.access_token);
      toast.success(`${mode === "login" ? "Logged in" : "Account created"}!`);
      router.push("/");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : `${mode === "login" ? "Login" : "Signup"} failed`;
      toast.error(message || "Something went wrong. Please try again.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,rgba(7,11,20,0.95),rgba(17,24,39,0.92))] px-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,140,255,0.12),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(91,107,255,0.10),transparent_35%)]" />

      <div className="relative w-full max-w-md space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-bold text-white">Indpro</h1>
          <p className="text-lg text-slate-400">Task Manager</p>
        </div>

        <div className="space-y-6 rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.6),rgba(2,6,23,0.5))] px-8 py-8 shadow-[0_30px_120px_rgba(0,0,0,0.35)]">
          <div className="flex gap-2">
            <button
              onClick={() => setMode("login")}
              className={cn(
                "flex-1 rounded-2xl px-4 py-2.5 text-sm font-medium transition-all duration-200",
                mode === "login"
                  ? "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-[0_0_20px_rgba(124,140,255,0.4)]"
                  : "bg-white/5 text-slate-300 hover:bg-white/10"
              )}
            >
              Login
            </button>
            <button
              onClick={() => setMode("signup")}
              className={cn(
                "flex-1 rounded-2xl px-4 py-2.5 text-sm font-medium transition-all duration-200",
                mode === "signup"
                  ? "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-[0_0_20px_rgba(124,140,255,0.4)]"
                  : "bg-white/5 text-slate-300 hover:bg-white/10"
              )}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-500" />
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11 h-11 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-indigo-500/50"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-500" />
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-11 h-11 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-indigo-500/50"
                  disabled={isLoading}
                />
              </div>
            </div>

            {mode === "signup" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-500" />
                  <Input
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-11 h-11 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-indigo-500/50"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-medium hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-50 mt-6"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === "login" ? "Logging in..." : "Creating account..."}
                </>
              ) : mode === "login" ? (
                "Login"
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-400">
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              {mode === "login" ? "Sign up" : "Login"}
            </button>
          </p>
        </div>

        <div className="relative space-y-4 rounded-[20px] border border-white/10 bg-white/5 px-6 py-4 backdrop-blur">
          <p className="text-xs text-slate-400">
            <span className="font-medium text-slate-300">Test Account:</span>
          </p>
          <div className="space-y-1 text-xs text-slate-400">
            <p>Email: <span className="font-mono text-slate-300">demo@example.com</span></p>
            <p>Password: <span className="font-mono text-slate-300">demo1234</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
