import { Link } from "react-router-dom";
import PublicLayout from "../components/layout/PublicLayout.jsx";
import PageHero from "../components/PageHero.jsx";
import Card from "../components/ui/Card.jsx";
import SectionHeader from "../components/ui/SectionHeader.jsx";
import IconBadge from "../components/IconBadge.jsx";
const howItWorksImage = "/images/edu-workshop.jpg";

const guestSteps = [
  {
    icon: "register",
    title: "Register for your track",
    desc: "Browse educational conferences, coding bootcamps, and AI summits. Secure your admission in seconds with instant digital badge generation.",
  },
  {
    icon: "checkin",
    title: "Verify admission at the door",
    desc: "Present your personal QR digital badge or 6-digit confirmation pin upon arrival. The organizer team checks you in under two seconds.",
  },
  {
    icon: "unlock",
    title: "Unlock keynote archives & media",
    desc: "The moment you check in, all exclusive lecture slides, recorded sessions, and private event photo galleries unlock strictly for verified attendees.",
  },
];

const organizerSteps = [
  {
    icon: "publish",
    role: "Organizer (Abaabule)",
    title: "Publish curriculum & track details",
    desc: "Configure event dates, venue or virtual links, academic categorization, capacity limits, and free or tiered certification passes.",
  },
  {
    icon: "shield",
    role: "Organizer (Abaabule)",
    title: "Approve registrations & roster",
    desc: "Monitor attendee signups in real-time, approve applications, confirm student bursaries or sponsorships, and export class rosters.",
  },
  {
    icon: "camera",
    role: "On-site Team",
    title: "Scan badges at the entrance",
    desc: "Use the built-in mobile camera scanner or rapid token lookup to verify attendees at the door without extra hardware or bottlenecks.",
  },
  {
    icon: "unlock",
    role: "Organizer & Media Team",
    title: "Distribute gated learning resources",
    desc: "Upload official lecture materials, slide decks, and high-resolution event media directly to the private archive reserved for checked-in participants.",
  },
];

export default function HowItWorksPage() {
  return (
    <PublicLayout>
      <PageHero
        eyebrow="Architecture & Operations"
        title="Designed for high-integrity educational and professional gatherings."
        subtitle="A verified lifecycle: attendees register and check in with zero friction, while organizers retain complete oversight over admissions, on-site check-in, and gated intellectual property."
        image={howItWorksImage}
      />

      <div className="shell-wrap py-12">
        {/* For Attendees Section */}
        <div className="section mt-4">
          <SectionHeader
            title="For Attendees, Students &amp; Professionals"
            subtitle="Three straightforward steps from discovery to private learning archives"
          />
          <div className="grid grid-3 gap-6 mt-6">
            {guestSteps.map((step, idx) => (
              <Card key={step.title} className="relative p-6">
                <div className="flex items-start justify-between">
                  <IconBadge icon={step.icon} tone="brand" />
                  <span className="text-slate-200 dark:text-slate-800 font-display font-extrabold text-4xl leading-none">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-5 mb-2 text-lg font-bold text-slate-900 dark:text-white">
                  {step.title}
                </h3>
                <p className="text-muted text-sm leading-relaxed mb-0">
                  {step.desc}
                </p>
              </Card>
            ))}
          </div>
        </div>

        {/* For Organizers Section */}
        <div className="section mt-16">
          <SectionHeader
            title="For Event Organizers &amp; Academic Leads"
            subtitle="Comprehensive administration from curriculum setup to door check-in"
            actions={
              <Link to="/organizer/signup" className="btn btn-primary text-xs">
                Open Organizer Account (Abaabule) â†’
              </Link>
            }
          />

          <div className="relative max-w-2xl mt-8">
            <div
              className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-slate-200 dark:bg-slate-800"
              aria-hidden="true"
            />

            <div className="space-y-8">
              {organizerSteps.map((step, idx) => (
                <div key={step.title} className="flex items-start gap-5 relative">
                  <div className="relative z-10 shrink-0">
                    <IconBadge icon={step.icon} tone="brand" />
                  </div>
                  <div className="pt-1 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-2 py-0.5 rounded">
                        {step.role}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">Step 0{idx + 1}</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white m-0">
                      {step.title}
                    </h3>
                    <p className="text-muted text-xs sm:text-sm mt-1.5 leading-relaxed m-0">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Ready to host CTA */}
        <div className="section mt-20 mb-8">
          <div className="rounded-3xl bg-brand-50 p-8 sm:p-12 border border-slate-200 text-center max-w-3xl mx-auto dark:bg-brand-950/40 dark:border-slate-800">
            <h2 className="display text-3xl sm:text-4xl text-slate-900 dark:text-white">
              Ready to host your next educational event?
            </h2>
            <p className="mt-4 text-slate-600 dark:text-slate-300 text-sm sm:text-base max-w-xl mx-auto">
              Join leading academic institutions, tech accelerators, and community leaders using Kulan to deliver modern, verified event experiences.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link to="/organizer/signup" className="btn btn-primary px-7 py-3 text-sm">
                Register as Organizer (Abaabule)
              </Link>
              <Link
                to="/events"
                className="btn btn-ghost px-6 py-3 text-sm"
              >
                Explore Current Programs
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

