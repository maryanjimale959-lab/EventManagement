import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import OrganizerConsoleLayout from "../../components/layout/OrganizerConsoleLayout.jsx";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import Alert from "../../components/ui/Alert.jsx";
import Badge from "../../components/ui/Badge.jsx";
import QrScanner from "../../components/QrScanner.jsx";
import { organizerClient } from "../../context/OrganizerAuthContext.jsx";

export default function OrganizerCheckInPage() {
  const [searchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState(searchParams.get("eventId") || "");
  const [registrationCode, setRegistrationCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [feed, setFeed] = useState([]);
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(null);

  const lastScanRef = useRef({ token: "", at: 0 });

  useEffect(() => {
    organizerClient
      .get("/api/organizer/events")
      .then((res) => {
        const evs = res.data.events || [];
        setEvents(evs);
        if (!eventId && evs.length > 0) {
          const openDoor = evs.find((e) => e.checkInOpen);
          setEventId(openDoor ? openDoor._id : evs[0]._id);
        }
      })
      .catch(() => setError("Could not load your events."));
  }, []);

  const event = events.find((e) => e._id === eventId);

  const submitCheckIn = useCallback(
    async ({ code, token }) => {
      if (!eventId) {
        setError("Select an event first.");
        return;
      }
      if (!code && !token) {
        setError("Enter a ticket code or scan a QR code.");
        return;
      }

      setError("");
      setAlreadyCheckedIn(null);
      setLoading(true);
      try {
        const payload = { eventId };
        if (code) payload.registrationCode = code.trim();
        if (token) payload.qrToken = token.trim();

        const res = await organizerClient.post("/api/organizer/check-in", payload);
        const { registration, guest } = res.data;

        setFeed((prev) => [
          {
            id: registration._id,
            guest,
            code: registration.registrationCode,
            planName: registration.planName,
            at: new Date(),
          },
          ...prev,
        ]);
        setRegistrationCode("");
      } catch (err) {
        if (err.response?.status === 409) {
          setAlreadyCheckedIn({
            guest: err.response.data?.guest,
            registration: err.response.data?.registration,
            message: err.response.data?.error?.message || "Guest was already checked in.",
          });
        } else {
          setError(err.response?.data?.error?.message || "Door check-in failed.");
        }
      } finally {
        setLoading(false);
      }
    },
    [eventId]
  );

  const handleQrScan = useCallback(
    (scannedText) => {
      if (!scannedText) return;
      // Strip base URL if QR contains a full URL like /events/:id/registration#token
      let token = scannedText;
      if (scannedText.includes("qrToken=")) {
        token = scannedText.split("qrToken=")[1].split("&")[0];
      } else if (scannedText.includes("code=")) {
        token = scannedText.split("code=")[1].split("&")[0];
      } else if (scannedText.includes("/")) {
        token = scannedText.split("/").pop();
      }

      const now = Date.now();
      if (lastScanRef.current.token === token && now - lastScanRef.current.at < 3000) {
        return;
      }
      lastScanRef.current = { token, at: now };

      if (token.startsWith("EVT-")) {
        submitCheckIn({ code: token });
      } else {
        submitCheckIn({ token });
      }
    },
    [submitCheckIn]
  );

  return (
    <OrganizerConsoleLayout
      title="Door Check-In & QR Scanner"
      subtitle="Scan guest QR codes or enter codes (EVT-XXXXXX) at the venue door"
      actions={
        eventId && (
          <Link to={`/organizer/events/${eventId}/registrations`}>
            <Button variant="secondary">View Full Guest List</Button>
          </Link>
        )
      }
    >
      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
        <div>
          <Card>
            <div className="mb-4">
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                Select Somali Gathering
              </label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                value={eventId}
                onChange={(e) => {
                  setEventId(e.target.value);
                  setError("");
                  setAlreadyCheckedIn(null);
                }}
              >
                {events.map((e) => (
                  <option key={e._id} value={e._id}>
                    {e.title} {e.checkInOpen ? "(✓ Door Open)" : "(Door Closed)"}
                  </option>
                ))}
              </select>
            </div>

            {event && !event.checkInOpen && (
              <Alert variant="warning">
                The check-in door is currently <strong>CLOSED</strong> for this event. Guests cannot be checked in until you open the door.
                <button
                  type="button"
                  onClick={async () => {
                    await organizerClient.patch(`/api/organizer/events/${eventId}/check-in`, { checkInOpen: true });
                    const res = await organizerClient.get("/api/organizer/events");
                    setEvents(res.data.events || []);
                  }}
                  className="block mt-2 underline font-bold"
                >
                  Click here to Open Door Now
                </button>
              </Alert>
            )}

            {/* Camera Scanner Toggle */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-slate-900 dark:text-white">Camera QR Scanner</span>
                <Button size="sm" variant={scanning ? "danger" : "primary"} onClick={() => setScanning((s) => !s)}>
                  {scanning ? "Stop Camera" : "Start Camera Scanner"}
                </Button>
              </div>

              {scanning && (
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden p-2 bg-black/5 dark:bg-black/30">
                  <QrScanner onScan={handleQrScan} />
                  <p className="text-center text-xs text-muted mt-2">Hold guest QR ticket in front of the lens.</p>
                </div>
              )}
            </div>

            {/* Manual Code Entry Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitCheckIn({ code: registrationCode });
              }}
              className="space-y-3"
            >
              <Input
                label="Manual Registration Code"
                id="registrationCode"
                name="registrationCode"
                value={registrationCode}
                onChange={(e) => setRegistrationCode(e.target.value.toUpperCase())}
                placeholder="e.g. EVT-3A9B2F"
                help="Type the 6-character code printed under the guest's QR ticket"
              />
              <Button type="submit" variant="primary" disabled={loading} style={{ width: "100%" }}>
                {loading ? "Checking In…" : "Check In Guest"}
              </Button>
            </form>

            {error && <div className="mt-4"><Alert variant="error">{error}</Alert></div>}

            {alreadyCheckedIn && (
              <div className="mt-4">
                <Alert variant="warning">
                  <div className="font-bold text-base mb-1">⚠️ Already Checked In!</div>
                  <p className="m-0 text-sm">{alreadyCheckedIn.message}</p>
                  {alreadyCheckedIn.guest && (
                    <p className="m-0 mt-1 text-xs">Guest: <strong>{alreadyCheckedIn.guest.fullName}</strong> ({alreadyCheckedIn.guest.email})</p>
                  )}
                </Alert>
              </div>
            )}
          </Card>
        </div>

        {/* Live Scan Feed */}
        <div>
          <h2 className="text-lg font-bold mb-3 mt-0 flex items-center justify-between">
            <span>Verified Guests ({feed.length})</span>
            {feed.length > 0 && (
              <button onClick={() => setFeed([])} className="text-xs text-muted hover:underline">
                Clear feed
              </button>
            )}
          </h2>

          <Card>
            {feed.length === 0 ? (
              <div className="text-center py-10 text-muted">
                <span className="text-3xl block mb-2">🎟️</span>
                <p className="m-0 text-sm">Ready to check in guests. Scanned passes will appear here in real-time.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {feed.map((item, idx) => (
                  <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-500 font-bold">✓</span>
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {item.guest?.fullName || "Guest"}
                        </span>
                        <Badge variant="success">Admitted</Badge>
                      </div>
                      <p className="text-xs text-muted m-0 mt-0.5">
                        Code: <span className="font-mono">{item.code}</span> · {item.planName || "Standard Pass"}
                      </p>
                    </div>
                    <span className="text-xs text-muted font-mono shrink-0">
                      {new Date(item.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
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
