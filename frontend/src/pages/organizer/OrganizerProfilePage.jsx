import { useState } from "react";
import OrganizerConsoleLayout from "../../components/layout/OrganizerConsoleLayout.jsx";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import Alert from "../../components/ui/Alert.jsx";
import ChangePasswordCard from "../../components/ChangePasswordCard.jsx";
import { organizerClient, useOrganizerAuth } from "../../context/OrganizerAuthContext.jsx";

export default function OrganizerProfilePage() {
  const { user, refreshUser } = useOrganizerAuth();
  const [form, setForm] = useState({
    fullName: user?.fullName || "",
    organization: user?.organization || "",
    phone: user?.phone || "",
    location: user?.location || "",
    bio: user?.bio || "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await organizerClient.patch("/api/users/me", form);
      await refreshUser();
      setMessage("✓ Organizer profile updated successfully");
    } catch (err) {
      setError(err.response?.data?.error?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <OrganizerConsoleLayout title="Organizer Profile" subtitle="Your organization details and security settings">
      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <Card>
            <h2 className="text-lg font-bold mt-0 mb-4">Organization Profile</h2>
            {message && <Alert variant="success">{message}</Alert>}
            {error && <Alert variant="error">{error}</Alert>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Organizer / Contact Name"
                id="fullName"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                required
              />
              <Input
                label="Organization / Company Brand"
                id="organization"
                name="organization"
                value={form.organization}
                onChange={handleChange}
                placeholder="e.g. Kulan Media & Events"
              />
              <Input
                label="Contact Phone Number"
                id="phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+252 61 XXX XXXX or +1 XXX XXX XXXX"
              />
              <Input
                label="Headquarters / City"
                id="location"
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="e.g. Mogadishu, Somalia"
              />
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Organizer Bio
                </label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  placeholder="Tell attendees about your event production team..."
                />
              </div>
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? "Saving…" : "Save Profile"}
              </Button>
            </form>
          </Card>
        </div>

        <div>
          <ChangePasswordCard client={organizerClient} userEmail={user?.email} />
        </div>
      </div>
    </OrganizerConsoleLayout>
  );
}
