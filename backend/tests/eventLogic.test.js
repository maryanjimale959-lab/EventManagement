import test, { before, after, describe } from "node:test";
import assert from "node:assert/strict";
import dotenv from "dotenv";

dotenv.config();

process.env.MEDIA_STORAGE = "local";
process.env.DISABLE_RATE_LIMIT = "true";
// Its own database: test files run in parallel, and other suites assume the
// events collection holds only their own fixtures.
process.env.MONGO_DB_NAME = "event_media_logic_test";

const { default: request } = await import("supertest");
const { default: mongoose } = await import("mongoose");
const { default: app } = await import("../src/app.js");
const { default: connectDB } = await import("../src/config/db.js");
const { default: User } = await import("../src/models/User.js");
const { default: Event } = await import("../src/models/Event.js");
const { signAccessToken } = await import("../src/utils/token.js");

const stamp = Date.now();
const day = 86400000;

const makeUser = async (role, name) => {
  const user = await User.create({
    fullName: name,
    email: `${name.replace(/\s+/g, "").toLowerCase()}-${stamp}-${Math.random().toString(36).slice(2, 6)}@test.local`,
    passwordHash: "hash",
    role,
    phone: "+252 61 555 1234",
    location: "Mogadishu",
    institution: "Mogadishu University",
    educationLevel: "bachelors",
    sex: "male",
    ...(role === "organizer" ? { organization: "Test Org" } : {}),
  });
  return { user, token: signAccessToken({ userId: user._id, role: user.role, email: user.email }) };
};

const auth = (t) => ({ Authorization: `Bearer ${t}` });

const makeEvent = (createdBy, overrides = {}) =>
  Event.create({
    title: `Logic ${Math.random().toString(36).slice(2, 6)}`,
    startDateTime: new Date(Date.now() + day),
    endDateTime: new Date(Date.now() + day + 3600000),
    status: "registration-open",
    published: true,
    createdBy,
    ...overrides,
  });

describe("real-life event logic", () => {
  before(async () => {
    await connectDB();
  });
  after(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  test("capacity: registration stops when full, and a cancellation frees the seat", async () => {
    const org = await makeUser("organizer", "Cap Org");
    const event = await makeEvent(org.user._id, { capacity: 1 });
    const a = await makeUser("attendee", "Guest A");
    const b = await makeUser("attendee", "Guest B");

    const first = await request(app).post(`/api/events/${event._id}/register`).set(auth(a.token)).send();
    assert.equal(first.status, 201);

    const second = await request(app).post(`/api/events/${event._id}/register`).set(auth(b.token)).send();
    assert.equal(second.status, 409);
    assert.equal(second.body.error.code, "EVENT_FULL");

    // A repeat request from the holder is not told the event is full.
    const repeat = await request(app).post(`/api/events/${event._id}/register`).set(auth(a.token)).send();
    assert.equal(repeat.status, 200);

    const pub = await request(app).get(`/api/events/${event._id}`);
    assert.equal(pub.body.seatsLeft, 0);

    const cancel = await request(app).delete(`/api/events/${event._id}/registration/me`).set(auth(a.token));
    assert.equal(cancel.status, 200);

    const retry = await request(app).post(`/api/events/${event._id}/register`).set(auth(b.token)).send();
    assert.equal(retry.status, 201);
  });

  test("capacity cannot be lowered below the places already taken", async () => {
    const org = await makeUser("organizer", "Low Org");
    const event = await makeEvent(org.user._id, { capacity: 5 });
    const a = await makeUser("attendee", "Guest C");
    await request(app).post(`/api/events/${event._id}/register`).set(auth(a.token)).send();

    const bad = await request(app).patch(`/api/organizer/events/${event._id}`).set(auth(org.token)).send({ capacity: 0 });
    assert.equal(bad.status, 400);
    const ok = await request(app).patch(`/api/organizer/events/${event._id}`).set(auth(org.token)).send({ capacity: 1 });
    assert.equal(ok.status, 200);
  });

  test("registration is closed once the event has ended, even if status is still open", async () => {
    const org = await makeUser("organizer", "Past Org");
    const event = await makeEvent(org.user._id, {
      startDateTime: new Date(Date.now() - 2 * day),
      endDateTime: new Date(Date.now() - day),
    });
    const a = await makeUser("attendee", "Guest D");
    const res = await request(app).post(`/api/events/${event._id}/register`).set(auth(a.token)).send();
    assert.equal(res.status, 403);
    assert.equal(res.body.error.code, "REGISTRATION_CLOSED");
  });

  test("a free plan (price 0) is treated as paid so the guest is not locked out", async () => {
    const org = await makeUser("organizer", "Free Org");
    const event = await makeEvent(org.user._id, {
      isPremium: true,
      plans: [{ name: "Community", price: 0 }],
    });
    const a = await makeUser("attendee", "Guest E");
    const res = await request(app)
      .post(`/api/events/${event._id}/register`)
      .set(auth(a.token))
      .send({ planId: String(event.plans[0]._id) });
    assert.equal(res.status, 201);
    assert.equal(res.body.registration.paymentStatus, "paid");
  });

  test("drafts are not readable by guessing the id, but staff can still open them", async () => {
    const org = await makeUser("organizer", "Draft Org");
    const draft = await makeEvent(org.user._id, { status: "draft", published: false });

    const anon = await request(app).get(`/api/events/${draft._id}`);
    assert.equal(anon.status, 404);

    const staff = await request(app).get(`/api/events/${draft._id}`).set(auth(org.token));
    assert.equal(staff.status, 200);
  });

  test("staff cannot check in guests at an event they do not own or work", async () => {
    const owner = await makeUser("organizer", "Owner Org");
    const other = await makeUser("organizer", "Other Org");
    const event = await makeEvent(owner.user._id, { checkInOpen: true });

    const res = await request(app)
      .post(`/api/events/${event._id}/checkin`)
      .set(auth(other.token))
      .send({ registrationCode: "EVT-AAAAAA" });
    assert.equal(res.status, 403);
    assert.equal(res.body.error.code, "FORBIDDEN");
  });

  test("completing an event closes its check-in, and a completed event cannot reopen it", async () => {
    const org = await makeUser("organizer", "Done Org");
    const event = await makeEvent(org.user._id, { checkInOpen: true });

    const done = await request(app)
      .patch(`/api/organizer/events/${event._id}`)
      .set(auth(org.token))
      .send({ status: "completed" });
    assert.equal(done.status, 200);
    assert.equal(done.body.event.checkInOpen, false);

    const reopen = await request(app)
      .patch(`/api/organizer/events/${event._id}/check-in`)
      .set(auth(org.token))
      .send({ checkInOpen: true });
    assert.equal(reopen.status, 409);
  });

  test("organizer rejects an invalid status instead of crashing", async () => {
    const org = await makeUser("organizer", "Bad Org");
    const event = await makeEvent(org.user._id);
    const res = await request(app)
      .patch(`/api/organizer/events/${event._id}`)
      .set(auth(org.token))
      .send({ status: "nonsense" });
    assert.equal(res.status, 400);
  });

  test("a rejected guest cannot cancel their rejection to re-register", async () => {
    const org = await makeUser("organizer", "Rej Org");
    const event = await makeEvent(org.user._id);
    const guest = await makeUser("attendee", "Guest Rej");

    const reg = await request(app).post(`/api/events/${event._id}/register`).set(auth(guest.token)).send();
    assert.equal(reg.status, 201);

    const rej = await request(app)
      .post(`/api/organizer/events/${event._id}/registrations/${reg.body.registration.id}/approval`)
      .set(auth(org.token))
      .send({ approvalStatus: "rejected", note: "Not eligible" });
    assert.equal(rej.status, 200);

    const cancel = await request(app).delete(`/api/events/${event._id}/registration/me`).set(auth(guest.token));
    assert.equal(cancel.status, 409);
    assert.equal(cancel.body.error.code, "REJECTED_REGISTRATION");
  });

  test("guest can submit a payment reference after registering for a paid event", async () => {
    const org = await makeUser("organizer", "PayRef Org");
    const event = await makeEvent(org.user._id, {
      isPremium: true,
      plans: [{ name: "Standard", price: 25 }],
    });
    const guest = await makeUser("attendee", "Guest PayRef");

    const reg = await request(app)
      .post(`/api/events/${event._id}/register`)
      .set(auth(guest.token))
      .send({ planId: String(event.plans[0]._id) });
    assert.equal(reg.status, 201);
    assert.equal(reg.body.registration.paymentReference, "");

    const upd = await request(app)
      .patch(`/api/events/${event._id}/registration/me/payment-reference`)
      .set(auth(guest.token))
      .send({ paymentReference: "EVC-992841" });
    assert.equal(upd.status, 200);
    assert.equal(upd.body.registration.paymentReference, "EVC-992841");
  });

  test("organizer guest list never leaks qrToken and weak organizer signups are rejected", async () => {
    const weak = await request(app)
      .post("/api/auth/organizer/signup")
      .send({ fullName: "Weak Org", organization: "Org", email: `weak-${stamp}@test.local`, password: "short" });
    assert.equal(weak.status, 400);

    const noOrg = await request(app)
      .post("/api/auth/organizer/signup")
      .send({ fullName: "No Org", organization: "", email: `noorg-${stamp}@test.local`, password: "StrongPass123" });
    assert.equal(noOrg.status, 400);

    const org = await makeUser("organizer", "Sec Org");
    const event = await makeEvent(org.user._id);
    const guest = await makeUser("attendee", "Guest Sec");
    const reg = await request(app).post(`/api/events/${event._id}/register`).set(auth(guest.token)).send();
    await request(app)
      .post(`/api/organizer/events/${event._id}/registrations/${reg.body.registration.id}/approval`)
      .set(auth(org.token))
      .send({ approvalStatus: "approved" });

    const list = await request(app)
      .get(`/api/organizer/events/${event._id}/registrations`)
      .set(auth(org.token));
    assert.equal(list.status, 200);
    assert.equal(list.body.registrations[0].qrToken, undefined);
    assert.ok(list.body.registrations[0].registrationCode);
  });
});
