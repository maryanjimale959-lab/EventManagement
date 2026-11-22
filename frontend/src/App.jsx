import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import AppRouter from "./routes/AppRouter.jsx";

export default function App() {
  const { pathname } = useLocation();

  // Start every page at the top.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  return (
    <div className="app-shell">
      <main key={pathname} className="page-fade">
        <AppRouter />
      </main>
    </div>
  );
}