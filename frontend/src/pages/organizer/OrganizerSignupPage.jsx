import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import Alert from "../../components/ui/Alert.jsx";
import ThemeToggle from "../../components/ThemeToggle.jsx";
import { organizerClient, useOrganizerAuth } from "../../context/OrganizerAuthContext.jsx";
import Logo from "../../components/Logo.jsx";

const PHONE_PATTERN = /^[+\d][\d\s()-]{6,19}$/;

export default function OrganizerSignupPage() {
  const navigate = useNavigate();
  const { adoptTokens } = useOrganizerAuth();
  const [form, setForm] = useState({
    fullName: "",
    organization: "",
    phone: "",
    location: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setError("");
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.fullName.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }
    if (form.organization.trim().length < 2) {
      setError("Please enter your organization or brand name.");
      return;
    }
    if (form.phone.trim() && !PHONE_PATTERN.test(form.phone.trim())) {
      setError("Please enter a valid contact phone number.");
      return;
    }
    if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) {
      setError("Password must be at least 8 characters and include both letters and numbers.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { confirmPassword, ...payload } = form;
      const res = await organizerClient.post("/api/auth/organizer/signup", payload);
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
      <div className="w-full max-w-md py-10">
        <div className="flex justify-center mb-6">
          <Logo size={30} label="Organizer" />
        </div>
        <Card>
          <h1 className="text-xl font-bold mt-0 mb-1 text-center">Create Organizer Account</h1>
          <p className="text-muted text-center mt-0 mb-5 text-sm">
            Host summits, workshops, hackathons, and conferences with QR door check-in and attendee approval.
          </p>
          <form onSubmit={handleSubmit} noValidate>
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
              label="Organization / Institution"
              id="organization"
              name="organization"
              value={form.organization}
              onChange={handleChange}
              placeholder="e.g. iRise Hub, SIMAD iLab, Redsea Cultural Foundation"
              required
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Phone Number"
                id="phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="+252 61 555 1234"
              />
              <Input
                label="City"
                id="location"
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="Mogadishu, Hargeisa, Garowe..."
              />
            </div>
            <Input
              label="Work Email"
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="e.g. events@organization.so"
              required
            />
            <Input
              label="Password"
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="8+ characters with letters & numbers"
              helper="At least 8 characters including both letters and numbers."
              required
            />
            <Input
              label="Confirm Password"
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter your password"
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
