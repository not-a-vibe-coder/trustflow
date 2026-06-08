import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Loader2, Lock } from "lucide-react";
import { Badge, Field, PrimaryButton, Wordmark } from "@/components/trustflow/ui";
import { loadState, persistUser, validateLogin } from "@/lib/trustflow";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "TrustFlow AI — Log in" },
      {
        name: "description",
        content: "Log in to your TrustFlow account to open and manage protected vaults.",
      },
    ],
  }),
});

function LoginPage() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("Chioma Esther");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Already signed in? Skip straight to the app.
  useEffect(() => {
    if (loadState().user) navigate({ to: "/app" });
  }, [navigate]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const user = validateLogin(identifier, password);
    if (!user) {
      setError("Those credentials don't match. Check your name/email and password.");
      return;
    }
    setBusy(true);
    persistUser(user);
    // tiny delay so the button state reads as a real sign-in
    setTimeout(() => navigate({ to: "/app" }), 500);
  };

  return (
    <main className="min-h-screen bg-[#EFEFEF] flex flex-col">
      <header className="mx-auto w-full max-w-[1100px] px-5 sm:px-8 py-4 flex items-center justify-between">
        <Wordmark />
        <a
          href="/"
          className="text-[13px] text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1.5"
        >
          <ArrowLeft size={14} /> Home
        </a>
      </header>

      <div className="flex-1 flex items-center justify-center px-5 py-10">
        <div className="grid lg:grid-cols-2 gap-10 items-center max-w-[920px] w-full">
          {/* Brand panel */}
          <div className="hidden lg:block">
            <Badge>Welcome back</Badge>
            <h1 className="mt-4 text-[36px] font-medium text-gray-900 tracking-[-0.02em] leading-[1.1]">
              Log in to
              <br />
              TrustFlow
            </h1>
            <p className="mt-4 text-[15px] text-gray-600 leading-[1.6] max-w-[42ch]">
              Open protected vaults, share a code with your buyer, and watch the money land safely —
              all in one place.
            </p>
            <ul className="mt-7 flex flex-col gap-3">
              {[
                "OPay-backed escrow vaults",
                "AI sets up the deal from your chat",
                "Real-time funding you can both see",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2.5 text-[14px] text-gray-700">
                  <span className="w-5 h-5 rounded-full bg-[#34D399]/20 flex items-center justify-center">
                    <Check size={12} className="text-[#059669]" />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Login card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_2px_24px_rgba(0,0,0,0.06)]">
            <h2 className="text-[22px] font-medium text-gray-900">Sign in</h2>
            <p className="text-[14px] text-gray-500 mt-1 mb-6">Use your TrustFlow credentials.</p>

            <form className="flex flex-col gap-4" onSubmit={submit}>
              <Field
                label="Name or email"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  setError(null);
                }}
                placeholder="Chioma Esther"
                autoComplete="username"
              />
              <Field
                label="Password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="••••••••"
                autoComplete="current-password"
                hint="Demo login — password: 54545454"
              />

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13px] px-3.5 py-2.5">
                  {error}
                </div>
              )}

              <div className="mt-2">
                {busy ? (
                  <div className="inline-flex items-center gap-2 text-[#059669] text-[14px] font-medium py-2.5">
                    <Loader2 size={16} className="animate-spin" /> Signing you in…
                  </div>
                ) : (
                  <PrimaryButton type="submit" full>
                    Log in
                  </PrimaryButton>
                )}
              </div>

              <p className="flex items-center justify-center gap-1.5 text-center text-[12px] text-gray-400">
                <Lock size={12} /> Your session stays on this device.
              </p>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
