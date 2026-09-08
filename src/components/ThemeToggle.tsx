"use client";

import { useSyncExternalStore } from "react";
import { MoonIcon, SunIcon } from "@/components/icons";
import {
  getServerTheme,
  getTheme,
  setTheme,
  subscribeTheme,
} from "@/lib/theme";

/** Lives in the dark sidebar, so it is styled against the sidebar tokens. */
export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeTheme, getTheme, getServerTheme);
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-active/60 hover:text-white"
    >
      {/* theme is null until hydration, so hold the space without guessing. */}
      {theme === null ? (
        <span className="h-5 w-5" />
      ) : isDark ? (
        <SunIcon />
      ) : (
        <MoonIcon />
      )}
      <span>
        {theme === null ? "Theme" : isDark ? "Light mode" : "Dark mode"}
      </span>
    </button>
  );
}
