import { useEffect } from "react";
import type { ThemePreference } from "@/lib/types";

/** Apply the resolved theme to the document root. */
export function applyTheme(theme: ThemePreference) {
  const root = document.documentElement;
  const resolved =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: light)").matches
        ? "light"
        : "dark"
      : theme;
  root.setAttribute("data-theme", resolved);
  root.classList.toggle("dark", resolved === "dark");
}

export function useTheme(theme: ThemePreference) {
  useEffect(() => {
    applyTheme(theme);
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const handler = () => applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);
}
