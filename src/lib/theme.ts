export type Theme = "light" | "dark";

export const THEME_KEY = "vikram_theme";

/** Runs before paint in <head> so the page never flashes the wrong theme. */
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");if(!t){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.classList.toggle("dark",t==="dark");}catch(e){}})();`;

// The theme lives on <html>, i.e. outside React — so it is read through
// useSyncExternalStore rather than mirrored into component state.
let listeners: Array<() => void> = [];

export function subscribeTheme(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((item) => item !== listener);
  };
}

export function getTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/** No theme is known during SSR, so callers render a neutral placeholder. */
export function getServerTheme(): Theme | null {
  return null;
}

export function setTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");

  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Private browsing can block writes; the class is already applied.
  }

  listeners.forEach((listener) => listener());
}
