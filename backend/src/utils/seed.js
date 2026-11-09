import dotenv from "dotenv";
import bcrypt from "bcrypt";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import Event from "../models/Event.js";

dotenv.config();

const seedUser = async ({ fullName, email, password, role, organization = "" }) => {
  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`${role} user already exists:`, email);
    return existing;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    fullName,
    email,
    passwordHash,
    role,
    organization,
    refreshTokens: [],
  });
  console.log(`${role} user created:`, email);
  return user;
};

// Demo events for the public Events page. Keyed by title so re-running is safe.
// Dates are offsets from today rather than fixed calendar days: a hard-coded
// list goes stale within weeks, and then the one thing the site has to show -
// an event you can register for - reads as finished.
const dayOffset = (days, hourUtc) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(hourUtc, 0, 0, 0);
  return d.toISOString();
};

const demoEvents = [
  {
    title: "Mogadishu Tech Summit 2026",
    description:
      "Somalia's premier technology conference bringing together founders, investors, developers, and telecom leaders across the Horn of Africa. Keynotes on AI, fintech, and digital infrastructure.",
    location: "Elite Hotel & Halane Conference Centre, Mogadishu",
    coverImageUrl: "/images/cover-tech-summit.jpg",
    isPremium: true,
    currency: "USD",
    plans: [
      { name: "Standard Delegate", price: 25, description: "Full conference track access, networking sessions & lunch." },
      { name: "VIP & Investor Lounge", price: 75, description: "VIP seating, founders mixer & private gala dinner." },
    ],
    startDateTime: dayOffset(7, 9),
    endDateTime: dayOffset(7, 18),
  },
  {
    title: "Hargeisa International Book Fair (HIBF)",
    description:
      "The annual celebration of Somali literature, poetry, folklore, and global contemporary thought. Featuring renowned Somali authors, poets, and international guests.",
    location: "Mansoor Hotel Cultural Hall, Hargeisa",
    coverImageUrl: "/images/cover-album-party.jpg",
    startDateTime: dayOffset(14, 10),
    endDateTime: dayOffset(14, 20),
  },
  {
    title: "Arooska Qarniga: Somali Royal Wedding & Dhaanto Gala",
    description:
      "A grand traditional Somali wedding reception and celebration with live traditional Oud orchestra, energetic Dhaanto dances, and a hosted banquet.",
    location: "Jazeera Palace Hotel Grand Ballroom, Mogadishu",
    coverImageUrl: "/images/cover-wedding.jpg",
    startDateTime: dayOffset(21, 19),
    endDateTime: dayOffset(21, 23),
  },
  {
    title: "Somali Diaspora Business & Investment Forum",
    description:
      "Connecting diaspora entrepreneurs from London, Minneapolis, Toronto, and Nairobi with homeland commercial ventures, solar energy projects, and modern real estate.",
    location: "Serena Hotel / Jazeera Beach Hall, Mogadishu",
    coverImageUrl: "/images/cover-product-launch.jpg",
    isPremium: true,
    currency: "USD",
    plans: [
      { name: "General Admission", price: 30, description: "Access to trade expo and investment panels." },
      { name: "Business Executive", price: 100, description: "B2B matchmaking session, VIP banquet & investment reports." },
    ],
    startDateTime: dayOffset(30, 9),
    endDateTime: dayOffset(30, 17),
  },
  {
    title: "Garowe Youth & Leadership Innovation Expo",
    description:
      "An inspiring gathering of Somali youth activists, tech builders, and creative minds sharing initiatives, grants, and mentorship.",
    location: "Puntland State Hall, Garowe",
    coverImageUrl: "/images/cover-night-market.jpg",
    startDateTime: dayOffset(42, 14),
    endDateTime: dayOffset(42, 21),
  },
];

const seedEvents = async (createdBy) => {
  for (const event of demoEvents) {
    // includeDeleted, otherwise trashing a demo event would make the next run
    // create a second copy of it under the same title.
    const existing = await Event.findOne({ title: event.title }).setOptions({ includeDeleted: true });
    if (existing) {
      // Demo dates are offsets from today, so a re-run refreshes them. Without
      // this the first seeded copy keeps ageing until every event on the
      // public page has finished. Only the demo content is rewritten - status,
      // publication and the check-in door stay whatever an admin set.
      if (!existing.deletedAt) {
        existing.startDateTime = new Date(event.startDateTime);
        existing.endDateTime = new Date(event.endDateTime);
        existing.description = event.description;
        existing.location = event.location;
        existing.coverImageUrl = event.coverImageUrl;
        await existing.save();
      }
      console.log(
        existing.deletedAt
          ? `event is in the trash, left alone: ${event.title}`
          : `event dates refreshed: ${event.title}`
      );
      continue;
    }

    await Event.create({
      ...event,
      startDateTime: new Date(event.startDateTime),
      endDateTime: new Date(event.endDateTime),
      visibility: "public",
      published: true,
      status: "registration-open",
      createdBy,
    });
    console.log("event created:", event.title);
  }
};

const seed = async () => {
  await connectDB();

  const admin = await seedUser({
    fullName: "System Admin (Maamulka)",
    email: "admin@example.com",
    password: "Admin123!",
    role: "admin",
  });

  const organizer = await seedUser({
    fullName: "Jama Musse",
    email: "organizer@example.com",
    password: "Organizer123!",
    role: "organizer",
    organization: "Kulan Media & Somali Events Co.",
  });

  await seedUser({
    fullName: "Astaan Media Team",
    email: "photographer@example.com",
    password: "Photo123!",
    role: "photographer",
  });

  // Deliberately left unregistered so the register -> check-in -> gallery
  // flow can be demonstrated from the beginning.
  await seedUser({
    fullName: "Amina Farah",
    email: "attendee@example.com",
    password: "Attend123!",
    role: "attendee",
  });

  await seedEvents(organizer._id || admin._id);

  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
