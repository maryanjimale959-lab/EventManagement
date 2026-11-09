import ConsoleLayout from "./ConsoleLayout.jsx";
import { useOrganizerAuth } from "../../context/OrganizerAuthContext.jsx";

const ICONS = {
  dashboard: <path d="M4 13h6V4H4v9Zm10 7h6V4h-6v16ZM4 20h6v-5H4v5Z" strokeLinecap="round" strokeLinejoin="round" />,
  events: <path d="M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" strokeLinecap="round" strokeLinejoin="round" />,
  checkin: <path d="M4 12l5 5L20 6" strokeLinecap="round" strokeLinejoin="round" />,
  camera: <path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" strokeLinecap="round" strokeLinejoin="round" />,
  profile: <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" strokeLinecap="round" strokeLinejoin="round" />,
};

const NAV_GROUPS = [
  {
    label: "Management",
    items: [
      { to: "/organizer/dashboard", end: true, label: "Overview", icon: ICONS.dashboard },
      { to: "/organizer/events", label: "My Events", icon: ICONS.events },
      { to: "/organizer/checkin", label: "Door Scanner", icon: ICONS.checkin },
    ],
  },
  {
    label: "Media & Team",
    items: [
      { to: "/organizer/photographers", label: "Photographers", icon: ICONS.camera },
      { to: "/organizer/profile", label: "My Profile", icon: ICONS.profile },
    ],
  },
];

export default function OrganizerConsoleLayout(props) {
  return (
    <ConsoleLayout
      brandLabel="Organizer"
      brandSub="Abaabule"
      navGroups={NAV_GROUPS}
      useAuth={useOrganizerAuth}
      loginPath="/organizer/login"
      profilePath="/organizer/profile"
      {...props}
    />
  );
}
