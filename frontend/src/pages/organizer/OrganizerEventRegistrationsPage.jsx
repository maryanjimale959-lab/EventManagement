import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import OrganizerConsoleLayout from "../../components/layout/OrganizerConsoleLayout.jsx";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Loading from "../../components/ui/Loading.jsx";
import Alert from "../../components/ui/Alert.jsx";
import { organizerClient } from "../../context/OrganizerAuthContext.jsx";

export default function OrganizerEventRegistrationsPage() {
  const { eventId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [actionId, setActionId] = useState(null);

  const load = async () => {
    try {
      const res = await organizerClient.get(`/api/organizer/events/${eventId}/registrations`);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || "Failed to load registrations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [eventId]);

  const handleApproval = async (regId, status) => {
    setActionId(regId);
    try {
      await organizerClient.post(`/api/organizer/events/${eventId}/registrations/${regId}/approval`, {
        approvalStatus: status,
      });
      await load();
    } catch (err) {
      alert(err.response?.data?.error?.message || "Failed to update approval status");
    } finally {
      setActionId(null);
    }
  };

  const handlePayment = async (regId, paymentStatus) => {
    setActionId(regId);
    try {
      await organizerClient.post(`/api/organizer/events/${eventId}/registrations/${regId}/payment`, {
        paymentStatus,
        paymentReference: paymentStatus === "paid" ? "Confirmed by Organizer" : "",
      });
      await load();
    } catch (err) {
      alert(err.response?.data?.error?.message || "Failed to update payment status");
    } finally {
      setActionId(null);
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
  const counts = data?.counts || { total: 0, attended: 0, approved: 0, pending: 0, paid: 0 };

  const filtered = registrations.filter((r) => {
    if (filter === "pending" && r.approvalStatus !== "pending") return false;
    if (filter === "approved" && r.approvalStatus !== "approved") return false;
    if (filter === "attended" && !r.attended) return false;
    if (filter === "unpaid" && r.paymentStatus !== "pending") return false;
    if (q) {
      const rx = new RegExp(q, "i");
      return (
        rx.test(r.user?.fullName || "") ||
        rx.test(r.user?.email || "") ||
        rx.test(r.user?.phone || "") ||
        rx.test(r.registrationCode || "")
      );
    }
    return true;
  });

  return (
    <OrganizerConsoleLayout
      title={`Guest List: ${event.title || "Event"}`}
      subtitle={`Manage attendee approvals, payment verification, and ticket codes`}
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

      {/* Quick Summary Pill Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl">
          <span className="text-xs text-muted uppercase font-bold block">Total Registered</span>
          <span className="display text-2xl font-bold text-slate-900 dark:text-white">{counts.total}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl">
          <span className="text-xs text-muted uppercase font-bold block">Awaiting Approval</span>
          <span className="display text-2xl font-bold text-amber-600">{counts.pending}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl">
          <span className="text-xs text-muted uppercase font-bold block">Checked In at Door</span>
          <span className="display text-2xl font-bold text-emerald-600">{counts.attended}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl">
          <span className="text-xs text-muted uppercase font-bold block">Confirmed Paid</span>
          <span className="display text-2xl font-bold text-brand-600 dark:text-brand-400">{counts.paid}</span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {["all", "pending", "approved", "attended", ...(event.isPremium ? ["unpaid"] : [])].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                filter === tab
                  ? "bg-brand-600 text-white"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64">
          <Input
            id="searchGuests"
            name="searchGuests"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, phone, code…"
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
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase">
                  <th className="py-3 px-2">Guest Name & Email</th>
                  <th className="py-3 px-2">Phone / City</th>
                  <th className="py-3 px-2">Ticket Plan</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2">Ticket Code</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-2">
                      <div className="font-bold text-slate-900 dark:text-white">{r.user?.fullName || "Guest"}</div>
                      <div className="text-xs text-muted">{r.user?.email}</div>
                    </td>

                    <td className="py-3 px-2 text-xs text-muted">
                      <div>{r.user?.phone || "—"}</div>
                      <div>{r.user?.location || ""}</div>
                    </td>

                    <td className="py-3 px-2">
                      <div className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                        {r.planName || "Standard Entry"}
                      </div>
                      {r.amountDue > 0 && (
                        <div className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                          ${r.amountDue} ({r.paymentStatus})
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-2">
                      <div className="flex flex-col gap-1 items-start">
                        <Badge variant={r.attended ? "success" : r.approvalStatus === "approved" ? "info" : r.approvalStatus === "rejected" ? "error" : "warning"}>
                          {r.attended ? "Checked In" : r.approvalStatus}
                        </Badge>
                      </div>
                    </td>

                    <td className="py-3 px-2">
                      {r.registrationCode ? (
                        <span className="font-mono text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {r.registrationCode}
                        </span>
                      ) : (
                        <span className="text-xs text-muted">Pending approval</span>
                      )}
                    </td>

                    <td className="py-3 px-2 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {r.approvalStatus !== "approved" && (
                          <Button
                            size="sm"
                            variant="primary"
                            disabled={actionId === r.id}
                            onClick={() => handleApproval(r.id, "approved")}
                          >
                            Approve
                          </Button>
                        )}
                        {r.approvalStatus !== "rejected" && !r.attended && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={actionId === r.id}
                            onClick={() => handleApproval(r.id, "rejected")}
                          >
                            Reject
                          </Button>
                        )}
                        {event.isPremium && r.paymentStatus !== "paid" && (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={actionId === r.id}
                            onClick={() => handlePayment(r.id, "paid")}
                          >
                            Confirm Paid
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </OrganizerConsoleLayout>
  );
}
