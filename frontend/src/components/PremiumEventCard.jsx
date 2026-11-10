import EventCard from "./EventCard.jsx";

// Paid events share the same card; only the price tag differs.
export default function PremiumEventCard({ event }) {
  return <EventCard event={event} />;
}
