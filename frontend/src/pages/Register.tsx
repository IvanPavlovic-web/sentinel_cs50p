import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AnimatedGradientBackground from "../components/ui/animated-gradient-background";
import GlitchWordmark from "../components/GlitchWordmark";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await register(email, password, fullName);
      navigate("/");
    } catch {
      setError("Registration failed. Email may already be in use.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-ops-bg px-4 overflow-hidden">
      <AnimatedGradientBackground gradientColors={["#0A0A0A", "#22D3EE", "#3c2cff", "#8B3DFF", "#FF3DA5", "#FFB800", "#7CFF5B"]} />
      <div className="relative z-10 w-full max-w-sm">
        <div className="flex items-center justify-center mb-8">
          <GlitchWordmark iconClassName="w-8 h-8" textClassName="text-2xl" gap="gap-3" />
        </div>

        <div className="auth-material card-glitch p-8 animate-sheetIn">
          <span className="card-glitch-lime" aria-hidden="true" />
          <h1 className="font-display text-xl font-semibold tracking-tight mb-6">Create account</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="register-name" className="block text-xs text-vivid-cyan/90 mb-1.5">Full name</label>
              <input
                id="register-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full rounded-full bg-ops-panel2 border border-ops-border px-3 py-2.5 text-sm transition-colors focus:outline-none focus:border-ops-accent"
              />
            </div>
            <div>
              <label htmlFor="register-email" className="block text-xs text-vivid-cyan/90 mb-1.5">Email</label>
              <input
                id="register-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-full bg-ops-panel2 border border-ops-border px-3 py-2.5 text-sm transition-colors focus:outline-none focus:border-ops-accent"
              />
            </div>
            <div>
              <label htmlFor="register-password" className="block text-xs text-vivid-cyan/90 mb-1.5">Password</label>
              <input
                id="register-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full rounded-full bg-ops-panel2 border border-ops-border px-3 py-2.5 text-sm transition-colors focus:outline-none focus:border-ops-accent"
              />
            </div>
            {error && <p className="text-xs text-status-critical">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-ops-accent text-ops-bg font-display font-semibold py-2.5 text-sm transition-colors hover:bg-ops-accentDim disabled:opacity-50 press"
            >
              {submitting ? "Creatingâ€¦" : "Create account"}
            </button>
          </form>
          <p className="text-xs text-vivid-cyan/90 mt-5 text-center">
            Already have an account?{" "}
            <Link to="/login" className="text-ops-accent font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
