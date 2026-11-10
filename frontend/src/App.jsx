import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import AppRouter from "./routes/AppRouter.jsx";

export default function App() {
  const { pathname } = useLocation();

  // Click feedback: a soft ripple on every .btn press.
  useEffect(() => {
    const onClick = (e) => {
      const btn = e.target.closest?.(".btn");
      if (!btn || btn.disabled || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
      btn.classList.add("btn-ripple");
      const r = btn.getBoundingClientRect();
      const dot = document.createElement("span");
      dot.className = "ripple-dot";
      dot.style.left = `${e.clientX - r.left}px`;
      dot.style.top = `${e.clientY - r.top}px`;
      btn.appendChild(dot);
      setTimeout(() => dot.remove(), 750);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // Scroll to top and fade the new page in on navigation.
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