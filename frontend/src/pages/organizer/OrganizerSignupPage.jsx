import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import Alert from "../../components/ui/Alert.jsx";
import ThemeToggle from "../../components/ThemeToggle.jsx";
import { organizerClient, useOrganizerAuth } from "../../context/OrganizerAuthContext.jsx";

export default function OrganizerSignupPage() {
  const navigate = useNavigate();
  const { adoptTokens } = useOrganizerAuth();
  const [form, setForm] = useState({ fullName: "", organization: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await organizerClient.post("/api/auth/organizer/signup", form);
      if (adoptTokens) {
        adoptTokens(res.data.accessToken, res.data.refreshToken, res.data.user);
      }
      navigate("/organizer/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.error?.message || "Organizer registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 p-5">
      <div className="absolute top-5 right-5 flex items-center gap-3">
        <Link to="/" className="text-sm font-semibold text-brand-600 dark:text-brand-300">
          ← Public Site
        </Link>
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2.5 justify-center mb-6 font-extrabold text-2xl">
          <span className="text-brand-500">★</span>
          <span>Kulan Events <span className="text-xs uppercase bg-brand-500/20 text-brand-500 px-2 py-0.5 rounded font-mono">Organizer</span></span>
        </div>
        <Card>
          <h1 className="text-xl font-bold mt-0 mb-1 text-center">Register As Organizer</h1>
          <p className="text-muted text-center mt-0 mb-5 text-sm">
            Host Somali conferences, cultural galas, weddings, and private gatherings.
          </p>
          <form onSubmit={handleSubmit}>
            <Input
              label="Full Name"
              id="fullName"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="e.g. Jama Musse"
              required
              autoFocus
            />
            <Input
              label="Organization / Production Brand"
              id="organization"
              name="organization"
              value={form.organization}
              onChange={handleChange}
              placeholder="e.g. Kulan Media & Somali Arts"
              required
            />
            <Input
              label="Work Email"
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="e.g. jama@kulanproductions.com"
              required
            />
            <Input
              label="Password"
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
              required
            />
            {error && <Alert variant="error">{error}</Alert>}
            <Button type="submit" disabled={loading} style={{ width: "100%", marginTop: "0.5rem" }}>
              {loading ? "Creating Account…" : "Create Organizer Account"}
            </Button>
            <div className="mt-4 text-center text-sm text-slate-500">
              Already have an organizer account?{" "}
              <Link to="/organizer/login" className="font-semibold text-brand-600 dark:text-brand-300">
                Sign in here
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
