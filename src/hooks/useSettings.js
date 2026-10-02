import { useEffect, useState } from "react";
import { PRESETS, FONTS } from "../rsvp.js";
const KEY = "rsvp-settings-v1";
const defaults = {
  wpm: 300,
  size: 64,
  preset: "auto",
  custom: { ...PRESETS.paper },
  font: "be",
  lang: null,
};
export function useSettings() {
  const [s, setS] = useState(() => {
    try {
      const v = {
        ...defaults,
        ...JSON.parse(localStorage.getItem(KEY) || "{}"),
      };
      if (!FONTS[v.font]) v.font = defaults.font;
      if (v.preset !== "auto" && v.preset !== "custom" && !PRESETS[v.preset])
        v.preset = "auto";
      return v;
    } catch {
      return defaults;
    }
  });
  const [dark, setDark] = useState(
    () => window.matchMedia?.("(prefers-color-scheme: dark)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const h = (e) => setDark(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {}
  }, [s]);
  const lang =
    s.lang ||
    (navigator.language?.toLowerCase().startsWith("en") ? "en" : "vi");
  const colors =
    s.preset === "auto"
      ? dark
        ? PRESETS.dark
        : PRESETS.paper
      : s.preset === "custom"
        ? s.custom
        : PRESETS[s.preset];
  const set = (patch) => setS((p) => ({ ...p, ...patch }));
  const toggleTheme = () =>
    set({
      preset:
        colors === PRESETS.dark ||
        (s.preset === "auto" && dark) ||
        s.preset === "dark"
          ? "paper"
          : "dark",
    });
  return { s, set, lang, colors, toggleTheme };
}
