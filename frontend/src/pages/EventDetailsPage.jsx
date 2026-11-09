import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import client from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import Card from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import Alert from "../components/ui/Alert.jsx";
import Badge from "../components/ui/Badge.jsx";
import Loading from "../components/ui/Loading.jsx";
import Input from "../components/ui/Input.jsx";
import SectionLayout, { useEventBase } from "../components/layout/SectionLayout.jsx";
import { getCategoryMeta } from "../utils/categories.js";

const formatDate = (value) => {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("en", {
      dateStyle: "full",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return String(value);
  }
};

export default function EventDetailsPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthed, profileComplete } = useAuth();
  const base = useEventBase();
  const [event, setEvent] = useState(null);
  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regLoading, setRegLoading] = useState(false);
  const [error, setError] = useState("");
  const [regError, setRegError] = useState("");
  const [profileBlocked, setProfileBlocked] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await client.get(`/api/events/${eventId}`);
        setEvent(res.data);
      } catch (err) {
        setError(err.response?.data?.error?.message || "Failed to load event details");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [eventId]);

  useEffect(() => {
    const loadRegistration = async () => {
      if (!isAuthed) return;
      try {
        const res = await client.get(`/api/events/${eventId}/registration/me`);
        setRegistration(res.data.registration);
      } catch {
        // Not registered
      }
    };
    loadRegistration();
  }, [eventId, isAuthed]);

  const handleRegister = async () => {
    if (!isAuthed) {
      navigate("/login");
      return;
    }
    setRegLoading(true);
    setRegError("");
    setProfileBlocked(false);
    try {
      const body = event?.isPremium ? { planId: selectedPlanId, paymentReference } : undefined;
      const res = await client.post(`/api/events/${eventId}/register`, body);
      setRegistration(res.data.registration);
    } catch (err) {
      const code = err.response?.data?.error?.code;
      if (code === "PROFILE_INCOMPLETE") setProfileBlocked(true);
      setRegError(err.response?.data?.error?.message || "Registration failed");
    } finally {
      setRegLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (registration?.registrationCode) {
      navigator.clipboard.writeText(registration.registrationCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const blockedByProfile = isAuthed && !profileComplete;
  const registrationOpen = event?.status ? event.status === "registration-open" : true;
  const categoryMeta = getCategoryMeta(event?.category);

  return (
    <SectionLayout
      title={event?.title || "Program Details"}
      subtitle={event ? `${event.category || "Education"} · ${event.location || "Online"}` : "Loading..."}
      actions={
        registration && (
          <Badge variant={registration.attended ? "success" : "warn"}>
            {registration.attended ? "Checked-in at door" : "Registered"}
          </Badge>
        )
      }
    >
      {loading && <Loading label="Loading program details..." />}
      {error && <Alert variant="error">{error}</Alert>}

      {!loading && event && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info Column (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cover image or graphic card */}
            <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              {event.coverImageUrl ? (
                <img
                  src={event.coverImageUrl}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-800 text-slate-500">
                  <span className="font-display font-bold text-5xl text-slate-600">
                    {event.category || "KULAN"}
                  </span>
                </div>
              )}
              <div className="absolute top-4 left-4">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold backdrop-blur-md shadow-sm border ${categoryMeta.badgeClass}`}
                >
                  <span className={`w-2 h-2 rounded-full ${categoryMeta.dotClass}`} />
                  <span>{event.category || "General"}</span>
                </span>
              </div>
            </div>

            {/* Overview & Description */}
            <Card className="p-7">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white m-0">
                About this Program
              </h2>
              <div className="mt-4 text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {event.description || "Detailed schedule and syllabus to be announced."}
              </div>

              {/* Schedule and venue cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span>Date &amp; Time</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white m-0">
                    {formatDate(event.startDateTime)}
                  </p>
                  {event.endDateTime && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 m-0">
                      Until: {formatDate(event.endDateTime)}
                    </p>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>Location &amp; Format</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white m-0">
                    {event.location || "Online / Hybrid"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 m-0">
                    {event.capacity ? `Capacity: ${event.capacity} seats` : "Open registration"}
                  </p>
                </div>
              </div>

              {/* Verified learning archive notice */}
              <div className="mt-6 p-4 rounded-xl bg-brand-50/60 dark:bg-brand-950/30 border border-brand-200/60 dark:border-brand-800/60 flex items-start gap-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-600 dark:text-brand-400 shrink-0 mt-0.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <div className="text-xs text-brand-900 dark:text-brand-200 leading-relaxed">
                  <strong>Protected Knowledge &amp; Media Archive:</strong> Verified check-in at the entrance unlocks full access to lecture slide decks, coding repositories, and private event photography.
                </div>
              </div>
            </Card>
          </div>

          {/* Registration & Action Sidebar (Right col) */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white m-0 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                Admission &amp; Access
              </h3>

              {!registrationOpen && !registration && (
                <Alert variant="info" className="mb-4">
                  {event.status === "completed"
                    ? "This program has completed. Registration is closed."
                    : "Registration is not currently open for this program."}
                </Alert>
              )}

              {registrationOpen && blockedByProfile && !registration && (
                <Alert variant="warn" className="mb-4">
                  <div>
                    Complete your attendee profile before registering.
                    {user?.missingProfileFields?.length > 0 && (
                      <div className="mt-1">
                        Needed: <strong>{user.missingProfileFields.join(", ")}</strong>
                      </div>
                    )}
                  </div>
                  <Link to="/dashboard/profile" className="mt-2 inline-block font-bold text-xs underline">
                    Complete Profile Now →
                  </Link>
                </Alert>
              )}

              {/* Free vs Premium Pricing Selection */}
              {event.isPremium && !registration && registrationOpen && (
                <div className="mb-5">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-3">
                    Select your admission tier:
                  </p>
                  <div className="space-y-2">
                    {(event.plans || []).map((plan) => (
                      <label
                        key={plan._id}
                        className={`block p-3 rounded-xl border cursor-pointer transition-all ${
                          selectedPlanId === plan._id
                            ? "border-brand-600 bg-brand-50/50 dark:bg-brand-950/40 dark:border-brand-500"
                            : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="plan"
                            checked={selectedPlanId === plan._id}
                            onChange={() => setSelectedPlanId(plan._id)}
                            className="accent-brand-600"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-sm text-slate-900 dark:text-white">
                                {plan.name}
                              </span>
                              <span className="font-extrabold text-sm text-brand-600 dark:text-brand-400">
                                {event.currency || "USD"} {plan.price}
                              </span>
                            </div>
                            {plan.description && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 m-0 truncate">
                                {plan.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="mt-4">
                    <Input
                      label="Payment Reference (optional)"
                      helper="Mobile money, Zaad, Sahal, or wire reference to expedite verification."
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Not Registered: Action Button */}
              {!registration && registrationOpen && (
                <div>
                  <Button
                    onClick={handleRegister}
                    disabled={regLoading || blockedByProfile || (event.isPremium && !selectedPlanId)}
                    className="w-full py-3"
                  >
                    {regLoading
                      ? "Registering..."
                      : event.isPremium
                      ? "Confirm & Register for Pass"
                      : "Register for Free Admission"}
                  </Button>
                </div>
              )}

              {/* Already Registered: Digital Badge Details */}
              {registration && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-brand-50 dark:bg-brand-950/50 border border-brand-200 dark:border-brand-800">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                      Your Digital Admission Code
                    </span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-mono text-2xl font-extrabold text-slate-900 dark:text-white tracking-wider">
                        {registration.registrationCode}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-brand-200 dark:border-brand-700 text-brand-700 dark:text-brand-300 hover:bg-brand-100"
                      >
                        {copiedCode ? "Copied!" : "Copy"}
                      </button>
                    </div>

                    {event.isPremium && (
                      <div className="mt-3 pt-3 border-t border-brand-200/60 dark:border-brand-800/60 flex items-center justify-between text-xs">
                        <span className="text-slate-600 dark:text-slate-300">
                          {registration.planName} · {registration.currency} {registration.amountDue}
                        </span>
                        <Badge
                          variant={
                            registration.paymentStatus === "paid"
                              ? "success"
                              : registration.paymentStatus === "refunded"
                              ? "neutral"
                              : "warn"
                          }
                        >
                          {registration.paymentStatus === "paid" ? "Paid" : "Payment Pending"}
                        </Badge>
                      </div>
                    )}

                    <div className="mt-3 pt-3 border-t border-brand-200/60 dark:border-brand-800/60 flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-300">Venue Status</span>
                      <span
                        className={`font-semibold ${
                          registration.attended
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {registration.attended ? "Verified on-site" : "Not yet checked in"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      variant="primary"
                      onClick={() => navigate(`${base}/${eventId}/registration`)}
                      className="w-full text-xs"
                    >
                      View Digital Pass &amp; QR Badge →
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => navigate(`${base}/${eventId}/gallery`)}
                      className="w-full text-xs"
                    >
                      Access Private Archive &amp; Gallery
                    </Button>
                  </div>
                </div>
              )}

              {regError && !profileBlocked && (
                <Alert variant="error" className="mt-4 text-xs">
                  {regError}
                </Alert>
              )}
            </Card>

            {/* Quick Organizer Info */}
            <Card className="p-5 text-xs text-slate-500 dark:text-slate-400 space-y-2">
              <div className="font-semibold text-slate-900 dark:text-white">
                Event Verification Standard
              </div>
              <p className="m-0 leading-relaxed">
                Tickets and passes issued on Kulan are verified via cryptographic tokens. Please have your QR pass ready on your phone or printed upon arrival.
              </p>
            </Card>
          </div>
        </div>
      )}
    </SectionLayout>
  );
}
