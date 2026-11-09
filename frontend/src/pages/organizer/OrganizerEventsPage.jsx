import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import OrganizerConsoleLayout from "../../components/layout/OrganizerConsoleLayout.jsx";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Alert from "../../components/ui/Alert.jsx";
import Loading from "../../components/ui/Loading.jsx";
import { organizerClient } from "../../context/OrganizerAuthContext.jsx";

const SOMALI_CITIES = [
  "Mogadishu, Somalia",
  "Hargeisa, Somaliland",
  "Garowe, Puntland",
  "Kismayo, Jubaland",
  "Bosaso, Puntland",
  "Baidoa, Southwest",
  "Nairobi, Kenya (Eastleigh / Parklands)",
  "London, UK",
  "Minneapolis / St. Paul, MN, USA",
  "Columbus, OH, USA",
  "Toronto, Canada",
  "Dubai, UAE",
];

const PRESET_COVERS = [
  { label: "Conference / Summit", url: "/images/edu-lecture.jpg" },
  { label: "Academic / Library", url: "/images/edu-library.jpg" },
    { label: "Study & Community", url: "/images/edu-hero.jpg" },
  { label: "Workshop / Business", url: "/images/edu-workshop.jpg" },
];

export default function OrganizerEventsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(searchParams.get("action") === "new");
  const [editingEvent, setEditingEvent] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "Mogadishu, Somalia",
    startDateTime: "",
    endDateTime: "",
    status: "registration-open",
    visibility: "public",
    isPremium: false,
    currency: "USD",
    plans: [{ name: "Standard Ticket", price: 20, description: "Full event access" }],
    coverImageUrl: "/images/edu-lecture.jpg",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = async () => {
    try {
      const res = await organizerClient.get("/api/organizer/events");
      setEvents(res.data.events || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreateModal = () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(10, 0, 0, 0);
    const nextWeekEnd = new Date(nextWeek);
    nextWeekEnd.setHours(17, 0, 0, 0);

    const pad = (n) => String(n).padStart(2, "0");
    const toLocalIso = (d) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

    setEditingEvent(null);
    setForm({
      title: "",
      description: "",
      location: "Elite Hotel, Mogadishu, Somalia",
      startDateTime: toLocalIso(nextWeek),
      endDateTime: toLocalIso(nextWeekEnd),
      status: "registration-open",
      visibility: "public",
      isPremium: false,
      currency: "USD",
      plans: [{ name: "Standard Delegate", price: 20, description: "Full event admission" }],
      coverImageUrl: "/images/edu-lecture.jpg",
    });
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (ev) => {
    setEditingEvent(ev);
    const toIso = (d) => (d ? new Date(d).toISOString().slice(0, 16) : "");
    setForm({
      title: ev.title || "",
      description: ev.description || "",
      location: ev.location || "",
      startDateTime: toIso(ev.startDateTime),
      endDateTime: toIso(ev.endDateTime),
      status: ev.status || "registration-open",
      visibility: ev.visibility || "public",
      isPremium: Boolean(ev.isPremium),
      currency: ev.currency || "USD",
      plans: ev.plans?.length ? ev.plans : [{ name: "General Admission", price: 10, description: "" }],
      coverImageUrl: ev.coverImageUrl || "/images/edu-lecture.jpg",
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      const payload = {
        ...form,
        startDateTime: new Date(form.startDateTime).toISOString(),
        endDateTime: new Date(form.endDateTime).toISOString(),
        plans: form.isPremium ? form.plans : [],
      };

      if (editingEvent) {
        await organizerClient.patch(`/api/organizer/events/${editingEvent._id}`, payload);
      } else {
        await organizerClient.post("/api/organizer/events", payload);
      }
      setModalOpen(false);
      setEditingEvent(null);
      await load();
    } catch (err) {
      setFormError(err.response?.data?.error?.message || "Failed to save event");
    } finally {
      setSaving(false);
    }
  };

  const toggleCheckIn = async (eventId, current) => {
    try {
      await organizerClient.patch(`/api/organizer/events/${eventId}/check-in`, { checkInOpen: !current });
      await load();
    } catch (err) {
      alert(err.response?.data?.error?.message || "Door check-in error");
    }
  };

  const trashEvent = async (eventId, title) => {
    if (!window.confirm(`Move "${title}" to trash?`)) return;
    try {
      await organizerClient.delete(`/api/organizer/events/${eventId}`);
      await load();
    } catch (err) {
      alert(err.response?.data?.error?.message || "Could not delete event");
    }
  };

  const filtered = events.filter((ev) => {
    if (statusFilter !== "all" && ev.status !== statusFilter) return false;
    if (q) {
      const rx = new RegExp(q, "i");
      return rx.test(ev.title) || rx.test(ev.location) || rx.test(ev.description);
    }
    return true;
  });

  return (
    <OrganizerConsoleLayout
      title="My Somali Events"
      subtitle="Publish and oversee your conferences, weddings, cultural festivals, and community forums"
      actions={
        <Button variant="primary" onClick={openCreateModal}>
          + Create New Event
        </Button>
      }
    >
      {error && <Alert variant="error">{error}</Alert>}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {["all", "registration-open", "draft", "completed"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                statusFilter === st
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              {st === "registration-open" ? "Open" : st}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-72">
          <Input
            id="search"
            name="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search events, venues, citiesâ€¦"
          />
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-4xl mb-2">ðŸŽª</p>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">No Somali events found</h3>
            <p className="text-muted text-sm max-w-sm mx-auto mb-5">
              Create your first Somali event to start taking registrations and scanning door tickets.
            </p>
            <Button variant="primary" onClick={openCreateModal}>
              Create Event Now
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((ev) => (
            <Card key={ev._id}>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-slate-900 aspect-square">
                    <img src={ev.coverImageUrl || "/images/edu-lecture.jpg"} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg m-0 text-slate-900 dark:text-white">{ev.title}</h3>
                      <Badge variant={ev.status === "registration-open" ? "success" : ev.status === "completed" ? "neutral" : "warning"}>
                        {ev.status}
                      </Badge>
                      {ev.isPremium && (
                        <Badge variant="warning">
                          Ticketed ({ev.plans?.length || 0} plans)
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted m-0 flex flex-wrap items-center gap-3">
                      <span>ðŸ“ {ev.location}</span>
                      <span>Â·</span>
                      <span>ðŸ“… {new Date(ev.startDateTime).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</span>
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-300">
                      <span>ðŸ‘¥ <strong>{ev.registrationCount || 0}</strong> Registered</span>
                      <span>ðŸšª <strong>{ev.attendedCount || 0}</strong> Checked In</span>
                      <span>ðŸ“¸ <strong>{ev.mediaCount || 0}</strong> Photos</span>
                      {ev.revenue > 0 && <span className="text-amber-600 dark:text-amber-400 font-bold">ðŸ’° ${ev.revenue} USD</span>}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-200 dark:border-slate-800">
                  <Button
                    size="sm"
                    variant={ev.checkInOpen ? "success" : "secondary"}
                    onClick={() => toggleCheckIn(ev._id, ev.checkInOpen)}
                  >
                    {ev.checkInOpen ? "âœ“ Door Open" : "Open Door"}
                  </Button>
                  <Link to={`/organizer/events/${ev._id}/registrations`}>
                    <Button size="sm" variant="ghost">Guest List</Button>
                  </Link>
                  <Link to={`/organizer/checkin?eventId=${ev._id}`}>
                    <Button size="sm" variant="ghost">Scan QR</Button>
                  </Link>
                  <Button size="sm" variant="ghost" onClick={() => openEditModal(ev)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => trashEvent(ev._id, ev.title)}>
                    Trash
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Event Modal */}
      {modalOpen && (
        <Modal
          title={editingEvent ? "Edit Somali Event" : "Create New Somali Event"}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
        >
          {formError && <Alert variant="error">{formError}</Alert>}
          <form onSubmit={handleSave} className="space-y-4">
            <Input
              label="Event Title"
              id="title"
              name="title"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Mogadishu Tech Summit 2026"
              required
              autoFocus
            />

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                Somali City / Venue
              </label>
              <input
                list="somali-cities"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                value={form.location}
                onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                placeholder="Select or enter city & venue"
                required
              />
              <datalist id="somali-cities">
                {SOMALI_CITIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Start Date & Time
                </label>
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                  value={form.startDateTime}
                  onChange={(e) => setForm((p) => ({ ...p, startDateTime: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  End Date & Time
                </label>
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                  value={form.endDateTime}
                  onChange={(e) => setForm((p) => ({ ...p, endDateTime: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Registration Status
                </label>
                <select
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                  value={form.status}
                  onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                >
                  <option value="draft">Draft (Private, not taking registrations)</option>
                  <option value="registration-open">Registration Open (Publicly joinable)</option>
                  <option value="completed">Completed (Event concluded)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Cover Photo Theme
                </label>
                <select
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                  value={form.coverImageUrl}
                  onChange={(e) => setForm((p) => ({ ...p, coverImageUrl: e.target.value }))}
                >
                  {PRESET_COVERS.map((cov) => (
                    <option key={cov.url} value={cov.url}>
                      {cov.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                Description / Highlights
              </label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="What can guests expect? Keynotes, Dhaanto dances, dinner banquets, live networking..."
              />
            </div>

            {/* Ticket Tier Configuration */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-900 dark:text-white">
                  <input
                    type="checkbox"
                    checked={form.isPremium}
                    onChange={(e) => setForm((p) => ({ ...p, isPremium: e.target.checked }))}
                    className="w-4 h-4 accent-brand-600"
                  />
                  <span>Paid Event / Ticketed Admission (USD $)</span>
                </label>
              </div>

              {form.isPremium && (
                <div className="space-y-3 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <p className="text-xs text-muted m-0">Define ticket plans in USD for guests to purchase:</p>
                  {form.plans.map((plan, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-800"
                        placeholder="Plan name (e.g. VIP Pass)"
                        value={plan.name}
                        onChange={(e) => {
                          const next = [...form.plans];
                          next[idx].name = e.target.value;
                          setForm((p) => ({ ...p, plans: next }));
                        }}
                        required
                      />
                      <div className="flex items-center gap-1 w-28">
                        <span className="text-xs text-muted">$</span>
                        <input
                          type="number"
                          min="0"
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-800"
                          placeholder="Price"
                          value={plan.price}
                          onChange={(e) => {
                            const next = [...form.plans];
                            next[idx].price = Number(e.target.value);
                            setForm((p) => ({ ...p, plans: next }));
                          }}
                          required
                        />
                      </div>
                      {form.plans.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setForm((p) => ({ ...p, plans: p.plans.filter((_, i) => i !== idx) }))}
                          className="text-red-500 hover:text-red-700 text-sm px-1 font-bold"
                        >
                          âœ•
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, plans: [...p.plans, { name: "", price: 25, description: "" }] }))}
                    className="text-xs font-bold text-brand-600 hover:underline"
                  >
                    + Add Another Ticket Tier
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? "Savingâ€¦" : editingEvent ? "Save Changes" : "Publish Event"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </OrganizerConsoleLayout>
  );
}


