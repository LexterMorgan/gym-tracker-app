import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const navigate = useNavigate();
  const { user, loading, login, googleLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-sm text-zinc-400">Loading…</div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Could not sign in");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="premium-surface rounded-2xl p-6"
      >
        <p className="text-[11px] uppercase tracking-[0.2em] text-violet-300">Gym Tracker</p>
        <h1 className="mt-1 text-2xl font-semibold text-white">Sign in</h1>
        <p className="mt-1 text-sm text-zinc-400">Use your email or Google. New here? Create an account.</p>

        {error && (
          <div className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>
        )}

        <form onSubmit={onSubmit} className="mt-5 space-y-3">
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Email</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="premium-input w-full rounded-xl border border-white/10 bg-black/25 p-3 text-sm text-white"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Password</label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="premium-input w-full rounded-xl border border-white/10 bg-black/25 p-3 text-sm text-white"
              required
            />
          </div>
          <motion.button
            type="submit"
            disabled={busy}
            whileTap={{ scale: 0.98 }}
            className="premium-button mt-2 w-full rounded-xl py-3 text-sm font-semibold disabled:opacity-50"
          >
            {busy ? "Signing in…" : "Sign in"}
          </motion.button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-400">
          No account?{" "}
          <Link to="/register" className="font-medium text-violet-300 hover:text-violet-200">
            Register
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
