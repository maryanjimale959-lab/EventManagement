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
    title: "Mogadishu Tech Summit (MTS)",
    description:
      "Somalia's flagship annual technology and innovation summit organized with iRise Hub and ecosystem partners. Brings together software engineers, startup founders, telecom leaders, policymakers, and students for keynotes, product demos, and panels on digital public infrastructure, fintech, and AI in Somalia.",
    location: "iRise Hub & Decale Conference Center, Mogadishu, Somalia",
    category: "Technology",
    coverImageUrl: "/images/kulan-symposium.jpg",
    capacity: 250,
    isPremium: true,
    currency: "USD",
    plans: [
      { name: "Student Pass", price: 0, description: "Complimentary access for university students with valid student ID." },
      { name: "General Delegate", price: 20, description: "Full access to all main-stage sessions, startup expo & networking." },
      { name: "Executive & Investor Pass", price: 75, description: "VIP seating, founder deal-room access & private dinner." },
    ],
    startDateTime: dayOffset(6, 9),
    endDateTime: dayOffset(7, 17),
  },
  {
    title: "SomNOG Annual Meeting & Network Engineering Workshops",
    description:
      "Hosted by the Somali Network Operators Group (SomNOG) and the Internet Society Somalia Chapter (ISOC-SO). Hands-on technical workshops covering BGP routing, DNSSEC, network security, IXP peering, and cloud infrastructure for Somali ISP engineers, sysadmins, and ICT students.",
    location: "SIMAD University Main Campus, Mogadishu, Somalia",
    category: "Workshops",
    coverImageUrl: "/images/edu-workshop.jpg",
    capacity: 120,
    isPremium: false,
    startDateTime: dayOffset(11, 9),
    endDateTime: dayOffset(13, 17),
  },
  {
    title: "SIMAD iLab Simathon — Innovation & AI Hackathon",
    description:
      "A 48-hour build weekend hosted by SIMAD iLab, Mogadishu's leading university startup incubator. Student developers, designers, and product builders team up to prototype Somali-language AI tools, civic-tech apps, and mobile-money fintech products with live mentorship and demo-day judging.",
    location: "SIMAD iLab, Mogadishu, Somalia",
    category: "Hackathons",
    coverImageUrl: "/images/edu-lecture.jpg",
    capacity: 90,
    isPremium: false,
    startDateTime: dayOffset(16, 9),
    endDateTime: dayOffset(18, 18),
  },
  {
    title: "Hargeysa International Book Fair (HIBF)",
    description:
      "Established by the Redsea Cultural Foundation, HIBF is the largest public literary and cultural festival in the Horn of Africa. Features Somali and international authors, poets, historians, book launches, panel discussions, and visual arts exhibitions celebrating Somali literature and knowledge.",
    location: "Hargeysa Cultural Centre, Hargeisa, Somaliland",
    category: "Education",
    coverImageUrl: "/images/edu-library.jpg",
    capacity: 400,
    isPremium: false,
    startDateTime: dayOffset(22, 10),
    endDateTime: dayOffset(25, 19),
  },
  {
    title: "Somalia Rising: Entrepreneurship & Investment Forum",
    description:
      "Convening Somali diaspora investors, local founders, commercial banks, and trade chambers to connect capital with high-impact ventures across renewable energy, logistics, agribusiness, and digital services. Includes curated founder pitch sessions and regulatory roundtables.",
    location: "Mogadishu Airport Conference Facility, Mogadishu, Somalia",
    category: "Business",
    coverImageUrl: "/images/kulan-networking.jpg",
    capacity: 180,
    isPremium: true,
    currency: "USD",
    plans: [
      { name: "Founder & SME Pass", price: 25, description: "Full forum access, pitch showcase & exhibitor hall." },
      { name: "Investor & Corporate Pass", price: 90, description: "Private dealmaking roundtables, pitch books & executive lunch." },
    ],
    startDateTime: dayOffset(28, 9),
    endDateTime: dayOffset(29, 17),
  },
  {
    title: "Somaliland Innovation & Startup Week",
    description:
      "A multi-day gathering in Hargeisa bringing together HarHub, Shaqodoon, and regional founders for AI & software workshops, startup pitch competitions, youth employability clinics, and digital commerce showcases.",
    location: "HarHub Innovation Center, Hargeisa, Somaliland",
    category: "Artificial Intelligence",
    coverImageUrl: "/images/edu-hero.jpg",
    capacity: 150,
    isPremium: true,
    currency: "USD",
    plans: [
      { name: "Community Ticket", price: 0, description: "Open access to keynotes, demo booths & community talks." },
      { name: "Workshop & Pitch Pass", price: 15, description: "Hands-on AI/cloud labs, mentor office hours & certificate." },
    ],
    startDateTime: dayOffset(34, 9),
    endDateTime: dayOffset(36, 17),
  },
  {
    title: "Garowe Book Fair & Civic Dialogue",
    description:
      "Puntland's signature annual literary and intellectual gathering in Garowe. Showcases emerging Somali writers, poets, and researchers through live readings, publishing panels, youth literacy workshops, and heritage discussions.",
    location: "Puntland State University Hall, Garowe, Somalia",
    category: "Education",
    coverImageUrl: "/images/edu-library.jpg",
    capacity: 300,
    isPremium: false,
    startDateTime: dayOffset(40, 10),
    endDateTime: dayOffset(42, 18),
  },
  {
    title: "Mogadishu Book Fair (MBF)",
    description:
      "Somalia's premier capital-city literary gathering convening authors, poets, academics, and publishing houses for book launches, Somali language preservation panels, and public conversations on history, society, and modern scholarship.",
    location: "Mogadishu University Auditorium, Mogadishu, Somalia",
    category: "Islamic Studies",
    coverImageUrl: "/images/edu-lecture.jpg",
    capacity: 350,
    isPremium: false,
    startDateTime: dayOffset(47, 10),
    endDateTime: dayOffset(49, 18),
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
        existing.category = event.category || "Technology";
        existing.capacity = event.capacity ?? null;
        existing.isPremium = Boolean(event.isPremium);
        if (event.plans) existing.plans = event.plans;
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

