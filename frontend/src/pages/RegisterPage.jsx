import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import client from "../api/client.js";
import Card from "../components/ui/Card.jsx";
import Input from "../components/ui/Input.jsx";
import Select from "../components/ui/Select.jsx";
import Button from "../components/ui/Button.jsx";
import Alert from "../components/ui/Alert.jsx";
import Stepper from "../components/ui/Stepper.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import PublicLayout from "../components/layout/PublicLayout.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import * as tokenStore from "../api/tokenStore.js";

const EDUCATION_LEVELS = [
  { value: "high-school", label: "High school" },
  { value: "certificate", label: "Certificate" },
  { value: "diploma", label: "Diploma" },
  { value: "bachelors", label: "Bachelor's degree" },
  { value: "masters", label: "Master's degree" },
  { value: "doctorate", label: "Doctorate" },
  { value: "other", label: "Other" },
];

const SEX_OPTIONS = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "prefer-not-to-say", label: "Prefer not to say" },
];

const STEPS = [
  { key: "details", label: "Your details" },
  { key: "password", label: "Password" },
];

// Where people are joining from. Stored as a single "City, Country" string so
// it reads the same everywhere it is shown. "Other" covers everyone else.
const LOCATIONS = [
  ...[
    "Mogadishu", "Hargeisa", "Kismayo", "Baidoa", "Garowe", "Bosaso", "Galkayo",
    "Beledweyne", "Jowhar", "Berbera", "Burao", "Borama", "Merca", "Afgooye",
    "Dhusamareb", "Las Anod",
  ].map((city) => ({ value: `${city}, Somalia`, label: `${city}, Somalia` })),
  { value: "Other", label: "Other / outside Somalia" },
];

// Mirrors utils/profileValidation.js on the server. Both must agree, so when
// one changes the other does too.
const PHONE_PATTERN = /^[+\d][\d\s()-]{6,19}$/;
const EMAIL_PATTERN = /\S+@\S+\.\S+/;

const EMPTY = {
  fullName: "", email: "", phone: "", location: "", institution: "",
  educationLevel: "", fieldOfStudy: "", sex: "",
  password: "", confirmPassword: "",
};

/** Step 1: everything an organiser needs on file before the account exists. */
const validateDetails = (form) => {
  const errors = {};
  if (!form.fullName.trim()) errors.fullName = "Full name is required";
  else if (form.fullName.trim().length < 2) errors.fullName = "Full name is too short";

  if (!form.email.trim()) errors.email = "Email is required";
  else if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = "That email address looks invalid";

  if (!form.phone.trim()) errors.phone = "Mobile number is required";
  else if (!PHONE_PATTERN.test(form.phone.trim())) errors.phone = "That phone number looks invalid";

  if (!form.location) errors.location = "Choose your location";
  if (!form.institution.trim()) errors.institution = "Institution is required";
  if (!form.educationLevel) errors.educationLevel = "Education level is required";
  if (!form.sex) errors.sex = "Sex is required";

  return errors;
};

/** Step 2: the password and its confirmation. */
const validatePassword = (form) => {
  const errors = {};
  if (!form.password) errors.password = "Password is required";
  else if (form.password.length < 6) errors.password = "Password must be at least 6 characters";

  if (!form.confirmPassword) errors.confirmPassword = "Please re-enter your password";
  else if (form.confirmPassword !== form.password) errors.confirmPassword = "Passwords do not match";
  return errors;
};

/** Says what actually went wrong instead of one generic line. */
const signupFailureMessage = (err) => {
  if (!err.response) {
    return "Cannot reach the server. Check that the backend is running and try again.";
  }
  if (err.response.status === 404) {
    return "The server does not have the sign-up route yet. Restart the backend and try again.";
  }
  if (err.response.status >= 500) {
    return "The server hit an error while creating your account. Check the backend console for details.";
  }
  return "Could not create your account. Please try again.";
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const { applyUser } = useAuth();
  const { showToast } = useToast();
  const headingRef = useRef(null);

  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const step = STEPS[stepIndex].key;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear a field's error as soon as the user starts fixing it, rather than
    // making them submit again to find out.
    setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
    setFormError("");
  };

  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  /** Applies a server-side field-error map onto the right step. */
  const applyServerErrors = (err, fallback) => {
    const data = err.response?.data?.error;
    if (data?.fields) {
      setErrors(data.fields);
      // Send the user back to the step that actually holds the bad field.
      const detailKeys = ["fullName", "email", "phone", "location", "institution",
        "educationLevel", "sex", "fieldOfStudy"];
      if (Object.keys(data.fields).some((k) => detailKeys.includes(k))) setStepIndex(0);
      else if (Object.keys(data.fields).some((k) => k === "password")) setStepIndex(1);
    }
    setFormError(data?.message || fallback);
  };

  const handleDetailsSubmit = (e) => {
    e.preventDefault();
    const found = validateDetails(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setFormError("");
    setStepIndex(1);
  };

  /** Step 2 submit: creates the account and signs the person straight in. */
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const found = validatePassword(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setLoading(true);
    setFormError("");
    try {
      const { confirmPassword, ...payload } = form;
      const res = await client.post("/api/auth/signup", payload);
      tokenStore.setAccessToken(res.data.accessToken);
      tokenStore.setRefreshToken(res.data.refreshToken);
      applyUser(res.data.user);
      // Raised before navigating; the provider sits above the router, so it
      // is still on screen when the dashboard renders.
      showToast(`Account created. Welcome, ${res.data.user.firstName || res.data.user.fullName}!`);
      navigate("/dashboard", { replace: true, state: { justSignedUp: true } });
    } catch (err) {
      applyServerErrors(err, signupFailureMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className="shell-wrap page" style={{ maxWidth: 640 }}>
        <PageHeader
          title="Create your account"
          subtitle="Two quick steps and you are ready to register for events"
        />

        <Card>
          {/* Progress across the two steps */}
          <Stepper steps={STEPS} current={stepIndex} className="mb-6" />

          {/* ---------- Step 1: profile details ---------- */}
          {step === "details" && (
            <form onSubmit={handleDetailsSubmit} noValidate>
              <h2 ref={headingRef} tabIndex={-1} className="mt-0 mb-1 text-lg font-bold">
                Your details
              </h2>
              <p className="helper-text mb-5">
                Event organisers need these on file, so we collect them once here — you
                will not be asked again after signing in.
              </p>

              <Input
                label="Full name" id="fullName" name="fullName" placeholder="Your full name"
                value={form.fullName} onChange={handleChange} error={errors.fullName} autoComplete="name"
              />
              <Input
                label="Email" id="email" name="email" type="email" placeholder="you@example.com"
                value={form.email} onChange={handleChange} error={errors.email} autoComplete="email"
                helper="This is what you will sign in with."
              />

              <div className="field-grid">
                <Input
                  label="Mobile number" id="phone" name="phone" type="tel" placeholder="+252 61 234 5678"
                  value={form.phone} onChange={handleChange} error={errors.phone} autoComplete="tel"
                />
                <Select
                  label="Location" id="location" name="location" placeholder="Choose your location"
                  value={form.location} onChange={handleChange} error={errors.location}
                  options={LOCATIONS}
                />
              </div>

              <Input
                label="Institution" id="institution" name="institution"
                placeholder="University, company or organisation"
                value={form.institution} onChange={handleChange} error={errors.institution}
              />

              <div className="field-grid">
                <Select
                  label="Highest education level" id="educationLevel" name="educationLevel"
                  value={form.educationLevel} onChange={handleChange}
                  error={errors.educationLevel} options={EDUCATION_LEVELS}
                />
                <Select
                  label="Sex" id="sex" name="sex" value={form.sex} onChange={handleChange}
                  error={errors.sex} options={SEX_OPTIONS}
                />
              </div>

              <Input
                label="Field of study" id="fieldOfStudy" name="fieldOfStudy" placeholder="Optional"
                value={form.fieldOfStudy} onChange={handleChange} error={errors.fieldOfStudy}
                helper="Leave blank if it does not apply to you."
              />

              {formError && <Alert variant="error" className="mb-4">{formError}</Alert>}

              <Button type="submit" style={{ width: "100%" }}>Continue to password</Button>

              <p className="text-muted" style={{ marginTop: "0.75rem", textAlign: "center" }}>
                Already have an account? <Link to="/login">Sign in</Link>
              </p>
            </form>
          )}

          {/* ---------- Step 2: password ---------- */}
          {step === "password" && (
            <form onSubmit={handlePasswordSubmit} noValidate>
              <h2 ref={headingRef} tabIndex={-1} className="mt-0 mb-1 text-lg font-bold">
                Choose a password
              </h2>
              <p className="helper-text mb-5">
                This is what you will sign in with, together with{" "}
                <strong className="break-all">{form.email}</strong>.
              </p>

              <Input
                label="Password" id="password" name="password" type="password"
                placeholder="Create a password" value={form.password} onChange={handleChange}
                error={errors.password} autoComplete="new-password"
                helper="At least 6 characters."
              />

              <Input
                label="Re-enter password" id="confirmPassword" name="confirmPassword" type="password"
                placeholder="Type it once more" value={form.confirmPassword} onChange={handleChange}
                error={errors.confirmPassword} autoComplete="new-password"
              />

              {formError && <Alert variant="error" className="mb-4">{formError}</Alert>}

              <div className="flex gap-2">
                <Button
                  type="button" variant="ghost" style={{ flex: 1 }} disabled={loading}
                  onClick={() => { setFormError(""); setStepIndex(0); }}
                >
                  Back
                </Button>
                <Button type="submit" style={{ flex: 2 }} loading={loading}>
                  {loading ? "Creating account…" : "Create account"}
                </Button>
              </div>
            </form>
          )}

        </Card>
      </div>
    </PublicLayout>
  );
}
