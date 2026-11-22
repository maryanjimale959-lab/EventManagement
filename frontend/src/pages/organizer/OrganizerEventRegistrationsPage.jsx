import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import OrganizerConsoleLayout from "../../components/layout/OrganizerConsoleLayout.jsx";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import Textarea from "../../components/ui/Textarea.jsx";
import Button from "../../components/ui/Button.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Loading from "../../components/ui/Loading.jsx";
import Alert from "../../components/ui/Alert.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Avatar from "../../components/Avatar.jsx";
import { organizerClient } from "../../context/OrganizerAuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";

const formatDateTime = (v) =>
  v ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(v)) : "—";

const STATUS_BADGE = {
  approved: { variant: "success", label: "Approved" },
  rejected: { variant: "danger", label: "Rejected" },
  pending: { variant: "warn", label: "Pending" },
};

export default function OrganizerEventRegistrationsPage() {
  const { eventId } = useParams();
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);

  // Active modals: guest inspection, approval decision, and payment verification.
  const [inspecting, setInspecting] = useState(null);
  const [decisionModal, setDecisionModal] = useState(null); // { reg, status }
  const [decisionNote, setDecisionNote] = useState("");
  const [paymentModal, setPaymentModal] = useState(null); // reg
  const [paymentRefInput, setPaymentRefInput] = useState("");

  const load = async () => {
    try {
      const res = await organizerClient.get(`/api/organizer/events/${eventId}/registrations`);
      setData(res.data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.error?.message || "Failed to load registrations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [eventId]);

  const openDecision = (reg, status) => {
    setDecisionModal({ reg, status });
    setDecisionNote(reg.decisionNote || "");
  };

  const submitDecision = async (e) => {
    e.preventDefault();
    if (!decisionModal) return;
    setBusy(true);
    try {
      const { reg, status } = decisionModal;
      const res = await organizerClient.post(`/api/organizer/events/${eventId}/registrations/${reg.id}/approval`, {
        approvalStatus: status,
        note: decisionNote.trim(),
      });
      setDecisionModal(null);
      setDecisionNote("");
      showToast(
        status === "approved"
          ? `Approved ${reg.user?.fullName || "guest"}. Pass code: ${res.data.registration?.registrationCode || "issued"}`
          : status === "rejected"
            ? `Rejected ${reg.user?.fullName || "guest"}'s registration.`
            : "Moved registration back to pending."
      );
      await load();
    } catch (err) {
      showToast(err.response?.data?.error?.message || "Failed to update approval status", "error");
    } finally {
      setBusy(false);
    }
  };

  const openPayment = (reg) => {
    setPaymentModal(reg);
    setPaymentRefInput(reg.paymentReference || "");
  };

  const submitPayment = async (paymentStatus) => {
    if (!paymentModal) return;
    setBusy(true);
    try {
      await organizerClient.post(`/api/organizer/events/${eventId}/registrations/${paymentModal.id}/payment`, {
        paymentStatus,
        // Preserve the guest's submitted reference unless the organizer explicitly edited it.
        paymentReference: paymentRefInput.trim() || paymentModal.paymentReference || undefined,
      });
      setPaymentModal(null);
      showToast(
        paymentStatus === "paid"
          ? `Payment confirmed for ${paymentModal.user?.fullName || "guest"}.`
          : `Payment marked as ${paymentStatus}.`
      );
      await load();
    } catch (err) {
      showToast(err.response?.data?.error?.message || "Failed to update payment status", "error");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <OrganizerConsoleLayout title="Guest Registrations">
        <Loading />
      </OrganizerConsoleLayout>
    );
  }

  const registrations = data?.registrations || [];
  const event = data?.event || {};
  const counts = data?.counts || { total: 0, attended: 0, approved: 0, rejected: 0, pending: 0, paid: 0, unpaid: 0 };
  const isCompleted = event.status === "completed";

  const needle = q.trim().toLowerCase();
  const filtered = registrations.filter((r) => {
    if (filter === "pending" && r.approvalStatus !== "pending") return false;
    if (filter === "approved" && r.approvalStatus !== "approved") return false;
    if (filter === "rejected" && r.approvalStatus !== "rejected") return false;
    if (filter === "attended" && !r.attended) return false;
    if (filter === "unpaid" && !(r.amountDue > 0 && r.paymentStatus === "pending")) return false;
    if (needle) {
      return [
        r.user?.fullName,
        r.user?.email,
        r.user?.phone,
        r.user?.institution,
        r.registrationCode,
        r.paymentReference,
      ]
        .filter(Boolean)
        .some((s) => String(s).toLowerCase().includes(needle));
    }
    return true;
  });

  const tabs = [
    { key: "all", label: `All (${counts.total})` },
    { key: "pending", label: `Pending (${counts.pending})` },
    { key: "approved", label: `Approved (${counts.approved})` },
    { key: "attended", label: `Checked in (${counts.attended})` },
    { key: "rejected", label: `Rejected (${counts.rejected || 0})` },
    ...(event.isPremium ? [{ key: "unpaid", label: `Unpaid (${counts.unpaid || 0})` }] : []),
  ];

  return (
    <OrganizerConsoleLayout
      title={`Guest List: ${event.title || "Event"}`}
      subtitle="Review applicant profiles, verify mobile-money payments, and approve door passes."
      actions={
        <div className="flex gap-2">
          <Link to={`/organizer/checkin?eventId=${eventId}`}>
            <Button variant="primary">Scan Door Tickets</Button>
          </Link>
          <Link to="/organizer/events">
            <Button variant="secondary">← Back to Events</Button>
          </Link>
        </div>
      }
    >
      {error && <Alert variant="error">{error}</Alert>}
      {isCompleted && (
        <Alert variant="info" className="mb-4">
          This event is marked as <strong>completed</strong>. Approval decisions are locked.
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl">
          <span className="text-xs text-muted font-semibold block">Seats Taken</span>
          <span className="display text-2xl font-bold text-slate-900 dark:text-white">
            {counts.total - (counts.rejected || 0)}
            {event.capacity ? <span className="text-sm font-normal text-muted"> / {event.capacity}</span> : null}
          </span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl">
          <span className="text-xs text-muted font-semibold block">Awaiting Approval</span>
          <span className="display text-2xl font-bold text-slate-900 dark:text-white">{counts.pending}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl">
          <span className="text-xs text-muted font-semibold block">Checked In</span>
          <span className="display text-2xl font-bold text-slate-900 dark:text-white">{counts.attended}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl">
          <span className="text-xs text-muted font-semibold block">
            {event.isPremium ? "Confirmed Paid" : "Approved"}
          </span>
          <span className="display text-2xl font-bold text-slate-900 dark:text-white">
            {event.isPremium ? counts.paid : counts.approved}
          </span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === tab.key
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950"
                  : "bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-72">
          <Input
            id="searchGuests"
            name="searchGuests"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, phone, code, payment ref…"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <p className="text-center text-muted py-8 m-0">No guest registrations match this filter.</p>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500">
                  <th className="py-3 px-2">Applicant</th>
                  <th className="py-3 px-2">Institution &amp; Contact</th>
                  <th className="py-3 px-2">Ticket &amp; Payment</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2">Pass Code</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filtered.map((r) => {
                  const badge = r.attended
                    ? { variant: "success", label: "Checked in" }
                    : STATUS_BADGE[r.approvalStatus] || STATUS_BADGE.pending;
                  const owesMoney = event.isPremium && r.amountDue > 0;
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-2">
                        <button
                          type="button"
                          onClick={() => setInspecting(r)}
                          className="text-left group flex items-center gap-2.5"
                        >
                          <Avatar user={r.user} size="sm" />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 dark:text-white group-hover:underline">
                              {r.user?.fullName || "Guest"}
                            </div>
                            <div className="text-xs text-muted">{r.user?.email}</div>
                          </div>
                        </button>
                      </td>

                      <td className="py-3 px-2 text-xs text-muted">
                        <div className="font-medium text-slate-700 dark:text-slate-300">
                          {r.user?.institution || "—"}
                        </div>
                        <div>{r.user?.phone || "No phone"}{r.user?.location ? ` · ${r.user.location}` : ""}</div>
                      </td>

                      <td className="py-3 px-2">
                        <div className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                          {r.planName || "Free Admission"}
                        </div>
                        {owesMoney && (
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <Badge variant={r.paymentStatus === "paid" ? "success" : r.paymentStatus === "refunded" ? "neutral" : "warn"}>
                              {r.currency} {r.amountDue} · {r.paymentStatus}
                            </Badge>
                            {r.paymentReference && (
                              <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                Ref: {r.paymentReference}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-2">
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                        {r.decisionNote && (
                          <div className="text-[11px] text-muted mt-1 max-w-[12rem] truncate" title={r.decisionNote}>
                            “{r.decisionNote}”
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-2">
                        {r.registrationCode ? (
                          <span className="font-mono text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                            {r.registrationCode}
                          </span>
                        ) : (
                          <span className="text-xs text-muted">—</span>
                        )}
                      </td>

                      <td className="py-3 px-2 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <Button size="sm" variant="ghost" onClick={() => setInspecting(r)}>
                            Review
                          </Button>
                          {owesMoney && r.approvalStatus !== "rejected" && (
                            <Button size="sm" variant="secondary" onClick={() => openPayment(r)}>
                              {r.paymentStatus === "paid" ? "Payment" : "Verify Payment"}
                            </Button>
                          )}
                          {!isCompleted && r.approvalStatus !== "approved" && (
                            <Button size="sm" variant="primary" onClick={() => openDecision(r, "approved")}>
                              Approve
                            </Button>
                          )}
                          {!isCompleted && r.approvalStatus !== "rejected" && !r.attended && (
                            <Button size="sm" variant="ghost" className="text-rose-600 dark:text-rose-400" onClick={() => openDecision(r, "rejected")}>
                              Reject
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Inspect Full Guest Profile Modal */}
      {inspecting && (
        <Modal title="Applicant Profile" onClose={() => setInspecting(null)}>
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <Avatar user={inspecting.user} size="md" />
              <div>
                <div className="font-bold text-base text-slate-900 dark:text-white">{inspecting.user?.fullName}</div>
                <div className="text-xs text-muted">{inspecting.user?.email}</div>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-3 m-0 text-xs">
              <div><dt className="text-muted">Phone</dt><dd className="m-0 font-semibold">{inspecting.user?.phone || "—"}</dd></div>
              <div><dt className="text-muted">Location</dt><dd className="m-0 font-semibold">{inspecting.user?.location || "—"}</dd></div>
              <div><dt className="text-muted">Institution</dt><dd className="m-0 font-semibold">{inspecting.user?.institution || "—"}</dd></div>
              <div><dt className="text-muted">Education</dt><dd className="m-0 font-semibold capitalize">{inspecting.user?.educationLevel || "—"}</dd></div>
              <div><dt className="text-muted">Field of study</dt><dd className="m-0 font-semibold">{inspecting.user?.fieldOfStudy || "—"}</dd></div>
              <div><dt className="text-muted">Registered at</dt><dd className="m-0 font-semibold">{formatDateTime(inspecting.registeredAt)}</dd></div>
              {inspecting.paymentReference && (
                <div className="col-span-2">
                  <dt className="text-muted">Payment reference</dt>
                  <dd className="m-0 font-mono font-semibold">{inspecting.paymentReference}</dd>
                </div>
              )}
              {inspecting.decidedAt && (
                <div className="col-span-2">
                  <dt className="text-muted">Last decision</dt>
                  <dd className="m-0">
                    <strong className="capitalize">{inspecting.approvalStatus}</strong> on {formatDateTime(inspecting.decidedAt)}
                    {inspecting.decidedBy?.fullName ? ` by ${inspecting.decidedBy.fullName}` : ""}
                  </dd>
                </div>
              )}
            </dl>

            {inspecting.user?.bio && (
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 text-xs">
                <div className="text-muted mb-1 font-semibold">Bio</div>
                <p className="m-0">{inspecting.user.bio}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setInspecting(null)}>Close</Button>
              {!isCompleted && inspecting.approvalStatus !== "approved" && (
                <Button variant="primary" onClick={() => { const r = inspecting; setInspecting(null); openDecision(r, "approved"); }}>
                  Approve Guest
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Approve / Reject Decision Modal with Note */}
      {decisionModal && (
        <Modal
          title={decisionModal.status === "approved" ? "Approve Registration" : "Reject Registration"}
          onClose={() => !busy && setDecisionModal(null)}
        >
          <form onSubmit={submitDecision} className="space-y-4">
            <p className="m-0 text-sm text-slate-600 dark:text-slate-300">
              {decisionModal.status === "approved" ? (
                <>
                  Approve <strong>{decisionModal.reg.user?.fullName}</strong>? A unique pass code and one-time QR
                  token will be issued and emailed to them.
                </>
              ) : (
                <>
                  Reject <strong>{decisionModal.reg.user?.fullName}</strong> for this event? Any previously issued pass
                  code will be immediately revoked, and their seat will be released.
                </>
              )}
            </p>

            {decisionModal.status === "approved" &&
              event.isPremium &&
              decisionModal.reg.amountDue > 0 &&
              decisionModal.reg.paymentStatus !== "paid" && (
                <Alert variant="warn" className="text-xs">
                  <strong>Payment not yet confirmed.</strong> They will receive a pass code, but door check-in will stay
                  blocked until you confirm their {decisionModal.reg.currency} {decisionModal.reg.amountDue} payment.
                </Alert>
              )}

            <Textarea
              label={decisionModal.status === "rejected" ? "Reason for rejection (recommended)" : "Note for guest (optional)"}
              id="decisionNote"
              value={decisionNote}
              onChange={(e) => setDecisionNote(e.target.value)}
              placeholder={
                decisionModal.status === "rejected"
                  ? "e.g. Event seats are prioritized for enrolled students, or payment could not be verified."
                  : "e.g. Please arrive 15 minutes early with your student ID."
              }
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setDecisionModal(null)} disabled={busy}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant={decisionModal.status === "rejected" ? "danger" : "primary"}
                disabled={busy}
              >
                {busy
                  ? "Saving…"
                  : decisionModal.status === "approved"
                    ? "Confirm Approval"
                    : "Confirm Rejection"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Payment Verification Modal */}
      {paymentModal && (
        <Modal title="Verify Ticket Payment" onClose={() => !busy && setPaymentModal(null)}>
          <div className="space-y-4 text-sm">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 text-xs space-y-1">
              <div>Guest: <strong>{paymentModal.user?.fullName}</strong> ({paymentModal.user?.phone || paymentModal.user?.email})</div>
              <div>Plan: <strong>{paymentModal.planName}</strong> — <strong>{paymentModal.currency} {paymentModal.amountDue}</strong></div>
              <div>Current status: <strong className="capitalize">{paymentModal.paymentStatus}</strong></div>
            </div>

            <Input
              label="Transaction / Payment Reference"
              id="paymentRefInput"
              value={paymentRefInput}
              onChange={(e) => setPaymentRefInput(e.target.value)}
              placeholder="e.g. EVC-849201, Zaad, Sahal, or bank receipt ID"
              helper="Keep the guest's submitted reference or record the receipt ID you verified."
            />

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setPaymentModal(null)} disabled={busy}>
                Cancel
              </Button>
              {paymentModal.paymentStatus === "paid" && (
                <Button type="button" variant="secondary" onClick={() => submitPayment("refunded")} disabled={busy}>
                  Mark Refunded
                </Button>
              )}
              {paymentModal.paymentStatus !== "paid" && (
                <Button type="button" variant="primary" onClick={() => submitPayment("paid")} disabled={busy}>
                  {busy ? "Confirming…" : "Confirm Paid"}
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </OrganizerConsoleLayout>
  );
}
