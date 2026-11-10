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
    title: "Horn of Africa AI & Machine Learning Summit 2026",
    description:
      "A flagship technology conference convening AI researchers, machine learning practitioners, and technology leaders. Deep dives into multilingual LLM training for Somali dialects, autonomous systems, neural computing, and ethical AI deployment in emerging markets.",
    location: "National Innovation & AI Hub, Mogadishu · In-Person & Streaming",
    category: "Artificial Intelligence",
    coverImageUrl: "/images/edu-lecture.jpg",
    isPremium: true,
    currency: "USD",
    plans: [
      { name: "Academic / Student Pass", price: 15, description: "Full technical sessions, research tracks & lab access." },
      { name: "Professional & Researcher Pass", price: 60, description: "VIP research symposium, executive networking & AI workshop kit." },
    ],
    startDateTime: dayOffset(5, 9),
    endDateTime: dayOffset(5, 18),
  },
  {
    title: "Full-Stack Cloud & Scalable Systems Hackathon",
    description:
      "A fast-paced 48-hour collaborative engineering hackathon. Engineers, designers, and students team up to build resilient cloud architectures, fintech integrations, and digital public goods. Mentored by senior industry architects.",
    location: "Puntland State University Computing Center, Garowe",
    category: "Hackathons",
    coverImageUrl: "/images/edu-workshop.jpg",
    isPremium: false,
    startDateTime: dayOffset(12, 10),
    endDateTime: dayOffset(14, 18),
  },
  {
    title: "Islamic Intellectual Thought & Contemporary Ethics Forum",
    description:
      "An esteemed scholarly gathering exploring Islamic philosophy, digital ethics, jurisprudence (Fiqh al-Mu'amalat) in modern commerce, and moral stewardship. Featuring keynote lectures by international academics and Islamic scholars.",
    location: "Grand Cultural & Research Auditorium, Hargeisa",
    category: "Islamic Studies",
    coverImageUrl: "/images/edu-library.jpg",
    isPremium: false,
    startDateTime: dayOffset(18, 14),
    endDateTime: dayOffset(18, 21),
  },
  {
    title: "Somali Founders & Venture Capital Masterclass",
    description:
      "An intensive executive seminar designed for high-growth entrepreneurs, angel syndicates, and diaspora investors. Covering cross-border capital, term sheets, corporate governance, unit economics, and regional expansion.",
    location: "Mogadishu Serena Executive Conference Center",
    category: "Business",
    coverImageUrl: "/images/edu-hero.jpg",
    isPremium: true,
    currency: "USD",
    plans: [
      { name: "Founder Ticket", price: 30, description: "Full access to investor panels & startup showcases." },
      { name: "Investor & Executive Circle", price: 95, description: "Private dealmaking dinner, pitch books & VIP networking." },
    ],
    startDateTime: dayOffset(25, 9),
    endDateTime: dayOffset(25, 17),
  },
  {
    title: "Applied Deep Learning with PyTorch & Modern DevOps Workshop",
    description:
      "A hands-on, code-first weekend workshop. Participants train custom neural networks, fine-tune open weights, build automated CI/CD container pipelines, and deploy production endpoints on Kubernetes clusters.",
    location: "Advanced Tech Lab, Mogadishu University Computing Campus",
    category: "Workshops",
    coverImageUrl: "/images/edu-lecture.jpg",
    isPremium: false,
    startDateTime: dayOffset(32, 9),
    endDateTime: dayOffset(33, 17),
  },
  {
    title: "Pan-Somali Academic Fellowship & Youth Leadership Symposium",
    description:
      "Empowering students and recent graduates with academic research grants, international scholarship mentorship, scientific publishing workshops, and career advancement tracks in higher education.",
    location: "Halane International Convention Center, Mogadishu",
    category: "Education",
    coverImageUrl: "/images/edu-library.jpg",
    isPremium: false,
    startDateTime: dayOffset(40, 9),
    endDateTime: dayOffset(40, 18),
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

