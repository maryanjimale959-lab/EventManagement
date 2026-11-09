import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import Card from "../components/ui/Card.jsx";
import Input from "../components/ui/Input.jsx";
import Button from "../components/ui/Button.jsx";
import Alert from "../components/ui/Alert.jsx";
import AuthShell from "../components/AuthShell.jsx";
import PublicLayout from "../components/layout/PublicLayout.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      // Send them back where they were headed, otherwise into the dashboard -
      // or straight to the profile if it still needs filling in.
      const from = location.state?.from;
      if (from) navigate(from, { replace: true });
      else navigate(user.profileComplete ? "/dashboard" : "/dashboard/profile", { replace: true });
    } catch (err) {
      const message = err.response?.data?.error?.message || "Login failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <AuthShell
        title="Welcome back"
        subtitle="Access your event workspace"
        image="/images/cover-album-party.jpg"
        imageAlt="Guests at an intimate release party listening to a live acoustic set"
        claim="The gallery is waiting for the people who showed up."
      >
        <Card>
          <form onSubmit={handleSubmit}>
            <Input
              label="Email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M3 7.5A1.5 1.5 0 0 1 4.5 6h15A1.5 1.5 0 0 1 21 7.5v9A1.5 1.5 0 0 1 19.5 18h-15A1.5 1.5 0 0 1 3 16.5v-9Zm1.5.5L12 13l7.5-5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              }
            />
            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="••••••"
              value={form.password}
              onChange={handleChange}
              required
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M7 10V7a5 5 0 0 1 10 0v3M5.5 10h13v10h-13V10Zm6.5 4v2.5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              }
            />
            <p style={{ marginTop: "-0.5rem", marginBottom: "1rem", textAlign: "right" }}>
              <Link to="/forgot-password" className="text-sm font-semibold text-brand-600 dark:text-brand-300">
                Forgot password?
              </Link>
            </p>
            {error && <Alert variant="error">{error}</Alert>}
            <Button type="submit" disabled={loading} style={{ width: "100%", marginTop: "0.5rem" }}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <p className="text-muted" style={{ marginTop: "0.75rem", textAlign: "center" }}>
            No account? <Link to="/register">Create one</Link>
          </p>
        </Card>
      </AuthShell>
    </PublicLayout>
  );
}
