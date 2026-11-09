import test, { before, after, describe } from "node:test";
import assert from "node:assert/strict";
import dotenv from "dotenv";

dotenv.config();

process.env.MEDIA_STORAGE = "local";
process.env.DISABLE_RATE_LIMIT = "true";
process.env.MONGO_DB_NAME = "event_media_test";

const { default: request } = await import("supertest");
const { default: mongoose } = await import("mongoose");
const { default: app } = await import("../src/app.js");
const { default: connectDB } = await import("../src/config/db.js");
const { default: User } = await import("../src/models/User.js");
const { default: Event } = await import("../src/models/Event.js");
const { default: EventRegistration } = await import("../src/models/EventRegistration.js");

describe("organizer phase", () => {
  before(async () => {
    await connectDB();
  });

  after(async () => {
    await mongoose.connection.close();
  });

  test("organizer signup and login", async () => {
    const email = `kulan-${Date.now()}@test.local`;
    const signupRes = await request(app)
      .post("/api/auth/organizer/signup")
      .send({
        fullName: "Kulan Organizer",
        organization: "Somali Event Collective",
        email,
        password: "OrganizerPass123!",
      });

    assert.equal(signupRes.status, 201);
    assert.equal(signupRes.body.user.role, "organizer");
    assert.ok(signupRes.body.accessToken);

    const loginRes = await request(app)
      .post("/api/auth/organizer/login")
      .send({
        email,
        password: "OrganizerPass123!",
      });

    assert.equal(loginRes.status, 200);
    assert.equal(loginRes.body.user.role, "organizer");
    assert.ok(loginRes.body.accessToken);
  });

  test("organizer creates event, approves guest, and checks guest in", async () => {
    const orgEmail = `hodan-${Date.now()}@test.local`;
    const orgRes = await request(app)
      .post("/api/auth/organizer/signup")
      .send({
        fullName: "Somali Host",
        organization: "Hodan Events",
        email: orgEmail,
        password: "OrganizerPass123!",
      });
    assert.equal(orgRes.status, 201);
    const orgToken = orgRes.body.accessToken;

    // 2. Create event
    const start = new Date(Date.now() + 86400000);
    const end = new Date(Date.now() + 86400000 + 14400000);
    const eventRes = await request(app)
      .post("/api/organizer/events")
      .set("Authorization", `Bearer ${orgToken}`)
      .send({
        title: "Mogadishu Creators Summit",
        description: "Gathering for Somali digital creatives.",
        location: "Elite Hotel, Mogadishu",
        startDateTime: start.toISOString(),
        endDateTime: end.toISOString(),
        status: "registration-open",
        visibility: "public",
      });

    assert.equal(eventRes.status, 201);
    const eventId = eventRes.body.event._id;

    // 3. Register an attendee (complete profile)
    const attendee = await User.create({
      fullName: "Farah Ahmed",
      email: `farah-${Date.now()}@test.local`,
      passwordHash: "hash",
      role: "attendee",
      phone: "+252 61 555 1234",
      location: "Mogadishu",
      institution: "Mogadishu University",
      educationLevel: "bachelors",
      sex: "male",
    });

    const { signAccessToken } = await import("../src/utils/token.js");
    const attendeeToken = signAccessToken({ userId: attendee._id, role: attendee.role, email: attendee.email });

    const attendeeRes = await request(app)
      .post(`/api/events/${eventId}/register`)
      .set("Authorization", `Bearer ${attendeeToken}`)
      .send();
    assert.equal(attendeeRes.status, 201);

    // 4. Open door check-in
    const openDoorRes = await request(app)
      .post(`/api/organizer/events/${eventId}/check-in/open`)
      .set("Authorization", `Bearer ${orgToken}`)
      .send();
    assert.equal(openDoorRes.status, 200);
    assert.equal(openDoorRes.body.checkInOpen, true);

    // 5. List registrations as organizer
    const regListRes = await request(app)
      .get(`/api/organizer/events/${eventId}/registrations`)
      .set("Authorization", `Bearer ${orgToken}`);
    assert.equal(regListRes.status, 200);
    assert.ok(regListRes.body.registrations.length >= 1);

    const reg = regListRes.body.registrations[0];

    // 6. Approve registration
    const approveRes = await request(app)
      .post(`/api/organizer/events/${eventId}/registrations/${reg.id}/approval`)
      .set("Authorization", `Bearer ${orgToken}`)
      .send({ approvalStatus: "approved" });
    assert.equal(approveRes.status, 200);
    assert.equal(approveRes.body.registration.approvalStatus, "approved");
    const code = approveRes.body.registration.registrationCode;
    assert.ok(code.startsWith("EVT-"));

    // 7. Check in guest at the door
    const checkInRes = await request(app)
      .post("/api/organizer/check-in")
      .set("Authorization", `Bearer ${orgToken}`)
      .send({ eventId, registrationCode: code });
    assert.equal(checkInRes.status, 200);
    assert.equal(checkInRes.body.registration.attended, true);

    // 8. Checking in again is refused
    const doubleCheckInRes = await request(app)
      .post("/api/organizer/check-in")
      .set("Authorization", `Bearer ${orgToken}`)
      .send({ eventId, registrationCode: code });
    assert.equal(doubleCheckInRes.status, 409);
  });
});
