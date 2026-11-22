import { useState } from "react";
import { Link } from "react-router-dom";
import Segmented from "./ui/Segmented.jsx";

const AUDIENCES = {
  attendees: {
    label: "Attendees",
    points: [
      { title: "Register in a minute", desc: "Pick an event, give your details once, and follow the approval from your dashboard." },
      { title: "A pass that works at the door", desc: "Your QR code is issued when the organizer approves you. It can be used once." },
      { title: "Keep what you learned", desc: "After you check in, the slides and photos from the event unlock for you." },
    ],
  },
  organizers: {
    label: "Organizers",
    points: [
      { title: "Publish and approve", desc: "Create events with plans and capacity, then approve or decline each registration." },
      { title: "Check people in", desc: "Scan QR passes at the door from any phone. Every scan is recorded." },
      { title: "Share materials privately", desc: "Slides and files reach the people who attended, and nobody else." },
    ],
  },
  photographers: {
    label: "Photographers",
    points: [
      { title: "Get assigned to events", desc: "Organizers add you to the events you are covering." },
      { title: "Upload as you shoot", desc: "Photos and videos go straight into the event gallery." },
      { title: "Only attendees see them", desc: "Galleries unlock after check-in, so private events stay private." },
    ],
  },
};

const OPTIONS = Object.entries(AUDIENCES).map(([value, a]) => ({ value, label: a.label }));

/** What the site is, in plain words, with a switch for who is reading. */
export default function AboutSection() {
  const [who, setWho] = useState("attendees");
  const current = AUDIENCES[who];

  return (
    <section className="band" id="about">
      <div className="shell-wrap grid gap-12 py-16 sm:py-24 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div className="min-w-0">
          <h2 className="display-serif m-0 text-4xl text-slate-950 sm:text-5xl dark:text-white">
            One place for the whole event, before and after the doors open.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-slate-600 dark:text-slate-400">
            Kulan is an events platform for universities, training weeks and conferences. People register and
            receive a QR pass, organizers approve them and check them in at the door, and photographers add
            the day's photos so only the people who were there can see them.
          </p>
          <Link to="/how-it-works" className="btn btn-ghost mt-8">Read the full guide</Link>
        </div>

        <div className="min-w-0">
          <Segmented label="Who is it for" value={who} onChange={setWho} options={OPTIONS} className="max-w-full overflow-x-auto" />
          <ul key={who} className="m-0 mt-6 list-none border-t border-slate-200 p-0 dark:border-slate-800">
            {current.points.map((p, i) => (
              <li
                key={p.title}
                className="rise border-b border-slate-200 py-5 dark:border-slate-800"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <h3 className="m-0 text-lg text-slate-900 dark:text-white">{p.title}</h3>
                <p className="m-0 mt-1.5 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">{p.desc}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
