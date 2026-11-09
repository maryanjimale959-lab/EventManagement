import EventCard from "./EventCard.jsx";

// Paid events share the exact same card; only the price line differs.
export default function PremiumEventCard({ event }) {
  return <EventCard event={event} />;
}
