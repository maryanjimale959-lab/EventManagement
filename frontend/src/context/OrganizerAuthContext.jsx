import { createRealm } from "../api/realm.js";
import { createRealmAuth } from "./createRealmAuth.jsx";

// Isolated from attendee, photographer, and admin realms:
// separate localStorage keys (`ems_organizer_*`), separate axios client, separate login.
export const organizerRealm = createRealm("organizer");
const { Provider, useRealmAuth } = createRealmAuth(organizerRealm, { loginPath: "/api/auth/organizer/login" });

export const OrganizerAuthProvider = Provider;
export const useOrganizerAuth = useRealmAuth;
export const organizerClient = organizerRealm.client;
export const organizerTokenStore = organizerRealm.tokenStore;
