import { useEffect, useState } from "react";
import OrganizerConsoleLayout from "../../components/layout/OrganizerConsoleLayout.jsx";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Avatar from "../../components/Avatar.jsx";
import Loading from "../../components/ui/Loading.jsx";
import Alert from "../../components/ui/Alert.jsx";
import { organizerClient } from "../../context/OrganizerAuthContext.jsx";

export default function OrganizerPhotographersPage() {
  const [photographers, setPhotographers] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assignedIds, setAssignedIds] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const [photoRes, evRes] = await Promise.all([
        organizerClient.get("/api/organizer/photographers"),
        organizerClient.get("/api/organizer/events"),
      ]);
      setPhotographers(photoRes.data.photographers || []);
      const evs = evRes.data.events || [];
      setEvents(evs);
      if (evs.length > 0) {
        setSelectedEventId(evs[0]._id);
        setAssignedIds(evs[0].photographers?.map((p) => p._id || p) || []);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || "Failed to load photographers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSelectEvent = (id) => {
    setSelectedEventId(id);
    const ev = events.find((e) => e._id === id);
    setAssignedIds(ev?.photographers?.map((p) => p._id || p) || []);
    setMessage("");
  };

  const togglePhotographer = (id) => {
    setAssignedIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSaveAssignments = async () => {
    if (!selectedEventId) return;
    setSaving(true);
    setMessage("");
    try {
      await organizerClient.post(`/api/organizer/events/${selectedEventId}/photographers`, {
        photographerIds: assignedIds,
      });
      setMessage("✓ Photographers successfully assigned to event!");
      await load();
    } catch (err) {
      setError(err.response?.data?.error?.message || "Failed to assign photographers");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <OrganizerConsoleLayout title="Photographer Team">
        <Loading />
      </OrganizerConsoleLayout>
    );
  }

  const selectedEvent = events.find((e) => e._id === selectedEventId);

  return (
    <OrganizerConsoleLayout
      title="Event Photographers & Media Team"
      subtitle="Assign professional Somali photographers to capture and upload photos to your private event galleries"
      actions={
        <Button variant="primary" disabled={saving || !selectedEventId} onClick={handleSaveAssignments}>
          {saving ? "Saving…" : "Save Assignments"}
        </Button>
      }
    >
      {error && <Alert variant="error">{error}</Alert>}
      {message && <Alert variant="success">{message}</Alert>}

      <div className="mb-6">
        <Card>
          <label className="block text-xs font-semibold text-slate-500 mb-1">
            Choose Event to Assign Team
          </label>
          <select
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
            value={selectedEventId}
            onChange={(e) => handleSelectEvent(e.target.value)}
          >
            {events.map((e) => (
              <option key={e._id} value={e._id}>
                {e.title} ({new Date(e.startDateTime).toLocaleDateString()})
              </option>
            ))}
          </select>
        </Card>
      </div>

      <h2 className="text-lg font-bold mb-3 mt-0">
        Available Photographers ({photographers.length})
      </h2>

      {photographers.length === 0 ? (
        <Card>
          <p className="text-muted text-center py-8 m-0">No photographers registered in the system yet.</p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {photographers.map((p) => {
            const isAssigned = assignedIds.includes(p.id);
            return (
              <Card key={p.id}>
                <div className="flex items-start gap-3">
                  <Avatar user={p} size={48} />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-base m-0 text-slate-900 dark:text-white truncate">
                      {p.fullName}
                    </h3>
                    <p className="text-xs text-muted m-0 truncate">{p.email}</p>
                    {p.phone && <p className="text-xs text-muted m-0">{p.phone}</p>}
                    <div className="mt-3 flex items-center justify-between">
                      <Badge variant={isAssigned ? "success" : "neutral"}>
                        {isAssigned ? "Assigned" : "Available"}
                      </Badge>
                      <Button
                        size="sm"
                        variant={isAssigned ? "danger" : "primary"}
                        onClick={() => togglePhotographer(p.id)}
                      >
                        {isAssigned ? "Remove" : "Assign"}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </OrganizerConsoleLayout>
  );
}
