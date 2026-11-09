import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import OrganizerConsoleLayout from "../../components/layout/OrganizerConsoleLayout.jsx";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Loading from "../../components/ui/Loading.jsx";
import Alert from "../../components/ui/Alert.jsx";
import { organizerClient, useOrganizerAuth } from "../../context/OrganizerAuthContext.jsx";

export default function OrganizerDashboardPage() {
  const { user } = useOrganizerAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [togglingDoorId, setTogglingDoorId] = useState(null);

  const load = async () => {
    try {
      const res = await organizerClient.get("/api/organizer/dashboard");
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || "Failed to load organizer dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleCheckIn = async (eventId, currentStatus) => {
    setTogglingDoorId(eventId);
    try {
      await organizerClient.patch(`/api/organizer/events/${eventId}/check-in`, { checkInOpen: !currentStatus });
      await load();
    } catch (err) {
      alert(err.response?.data?.error?.message || "Could not toggle door check-in");
    } finally {
      setTogglingDoorId(null);
    }
  };

  if (loading) {
    return (
      <OrganizerConsoleLayout title="Organizer Dashboard">
        <Loading />
      </OrganizerConsoleLayout>
    );
  }

  const stats = data?.stats || { totalEvents: 0, activeEvents: 0, totalRegistrations: 0, totalCheckedIn: 0, totalRevenue: 0 };
  const checkinRate = stats.totalRegistrations > 0 ? Math.round((stats.totalCheckedIn / stats.totalRegistrations) * 100) : 0;

  return (
    <OrganizerConsoleLayout
      title={`Kulan Events · Organizer Dashboard`}
      subtitle={`Welcome back, ${user?.fullName || "Organizer"}${user?.organization ? ` (${user.organization})` : ""}`}
      actions={
        <div className="flex gap-2">
          <Link to="/organizer/events?action=new">
            <Button variant="primary">+ Create Somali Event</Button>
          </Link>
          <Link to="/organizer/checkin">
            <Button variant="secondary">Door QR Scanner</Button>
          </Link>
        </div>
      }
    >
      {error && <Alert variant="error">{error}</Alert>}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <p className="eyebrow text-slate-500 m-0">My Somali Events</p>
          <p className="display text-3xl font-bold mt-2 mb-0 text-brand-600 dark:text-brand-400">
            {stats.totalEvents}
          </p>
          <p className="text-xs text-muted mt-1">{stats.activeEvents} open for registration</p>
        </Card>

        <Card>
          <p className="eyebrow text-slate-500 m-0">Total Registrations</p>
          <p className="display text-3xl font-bold mt-2 mb-0 text-slate-900 dark:text-white">
            {stats.totalRegistrations}
          </p>
          <p className="text-xs text-muted mt-1">Guests registered</p>
        </Card>

        <Card>
          <p className="eyebrow text-slate-500 m-0">Door Attendance Rate</p>
          <p className="display text-3xl font-bold mt-2 mb-0 text-emerald-600 dark:text-emerald-400">
            {checkinRate}%
          </p>
          <p className="text-xs text-muted mt-1">{stats.totalCheckedIn} checked in at door</p>
        </Card>

        <Card>
          <p className="eyebrow text-slate-500 m-0">Total Revenue</p>
          <p className="display text-3xl font-bold mt-2 mb-0 text-amber-600 dark:text-amber-400">
            ${stats.totalRevenue.toLocaleString()} <span className="text-xs font-normal text-muted">USD</span>
          </p>
          <p className="text-xs text-muted mt-1">Confirmed ticket sales</p>
        </Card>
      </div>

      <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
        {/* Upcoming Events & Door Control */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold m-0">Upcoming Somali Gatherings</h2>
            <Link to="/organizer/events" className="text-xs font-semibold text-brand-600 dark:text-brand-300">
              View All Events →
            </Link>
          </div>

          <div className="space-y-3">
            {data?.upcomingEvents?.length === 0 ? (
              <Card>
                <p className="text-muted text-center py-6 m-0">No upcoming events yet. Create your first event!</p>
              </Card>
            ) : (
              data?.upcomingEvents?.map((ev) => (
                <Card key={ev._id}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base m-0 text-slate-900 dark:text-white">{ev.title}</h3>
                        <Badge variant={ev.status === "registration-open" ? "success" : "neutral"}>
                          {ev.status}
                        </Badge>
                        {ev.isPremium && <Badge variant="warning">Ticketed</Badge>}
                      </div>
                      <p className="text-xs text-muted mt-1 mb-0 flex items-center gap-2">
                        <span>📍 {ev.location || "Mogadishu"}</span>
                        <span>·</span>
                        <span>📅 {new Date(ev.startDateTime).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={ev.checkInOpen ? "success" : "secondary"}
                        disabled={togglingDoorId === ev._id}
                        onClick={() => toggleCheckIn(ev._id, ev.checkInOpen)}
                      >
                        {togglingDoorId === ev._id
                          ? "Saving…"
                          : ev.checkInOpen
                          ? "✓ Door Open"
                          : "Open Door"}
                      </Button>
                      <Link to={`/organizer/events/${ev._id}/registrations`}>
                        <Button size="sm" variant="ghost">Guest List</Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Recent Registrations Feed */}
        <div>
          <h2 className="text-lg font-bold mb-3 mt-0">Recent Guests</h2>
          <Card>
            {data?.recentRegistrations?.length === 0 ? (
              <p className="text-muted text-center py-6 m-0">No registrations yet.</p>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {data?.recentRegistrations?.map((r) => (
                  <div key={r.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm m-0 truncate text-slate-900 dark:text-white">{r.guestName}</p>
                      <p className="text-xs text-muted m-0 truncate">{r.eventTitle}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge variant={r.attended ? "success" : r.approvalStatus === "approved" ? "info" : "neutral"}>
                        {r.attended ? "Checked In" : r.approvalStatus}
                      </Badge>
                      {r.amountDue > 0 && (
                        <p className="text-xs font-mono font-medium text-amber-600 dark:text-amber-400 m-0 mt-0.5">
                          ${r.amountDue} ({r.paymentStatus})
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </OrganizerConsoleLayout>
  );
}
