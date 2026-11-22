import { useLocation } from "react-router-dom";
import PublicLayout from "./PublicLayout.jsx";
import DashboardLayout from "./DashboardLayout.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

/** True while anywhere under /dashboard. */
export const useInDashboard = () => useLocation().pathname.startsWith("/dashboard");

/**
 * Base path for event links. Signed-in attendees stay inside the dashboard
 * shell rather than being bounced back out to public pages.
 */
export const useEventBase = () => {
  const inDashboard = useInDashboard();
  const { isAuthed } = useAuth();
  return inDashboard || isAuthed ? "/dashboard/events" : "/events";
};

/**
 * Renders a page inside whichever shell matches the current session: logged-in
 * attendees always stay inside DashboardLayout (no public navbar/footer).
 */
export default function SectionLayout({ title, subtitle, actions, children }) {
  const inDashboard = useInDashboard();
  const { isAuthed } = useAuth();

  if (inDashboard || isAuthed) {
    return (
      <DashboardLayout title={title} subtitle={subtitle} actions={actions}>
        {children}
      </DashboardLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="shell-wrap page">
        {title && (
          <div className="page-header mb-6">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold m-0">{title}</h1>
              {subtitle && <p className="text-muted m-0 mt-1">{subtitle}</p>}
            </div>
            {actions && <div className="header-actions">{actions}</div>}
          </div>
        )}
        {children}
      </div>
    </PublicLayout>
  );
}
