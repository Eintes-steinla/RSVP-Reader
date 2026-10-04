import { useMemo, useState } from "react";
import { dict } from "./i18n.js";
import { tokenize, FONTS } from "./rsvp.js";
import { useSettings } from "./hooks/useSettings.js";
import { useAudio } from "./hooks/useAudio.js";
import { useExport } from "./hooks/useExport.js";
import InputScreen from "./components/InputScreen.jsx";
import Reader from "./components/Reader.jsx";
import SettingsPanel from "./components/SettingsPanel.jsx";

const REPO_URL = "https://github.com/Eintes-steinla/RSVP-Reader";

export default function App() {
  const st = useSettings();
  const t = dict[st.lang];
  const audio = useAudio(st.s, st.set);
  const exp = useExport();
  const [doc, setDoc] = useState(null); // { words, pageStarts }
  const [showSettings, setShowSettings] = useState(false);

  const start = (pages) => {
    // pages: string[][] (trang -> đoạn)
    const words = [];
    const paraStarts = new Set();
    const pageAt = new Map();
    pages.forEach((paras, pi) => {
      const before = words.length;
      paras.forEach((p) => {
        const w = tokenize(p);
        if (w.length) {
          paraStarts.add(words.length);
          words.push(...w);
        }
      });
      if (words.length > before) pageAt.set(before, pi + 1);
    });
    if (!words.length) return false;
    setDoc({ words, paraStarts, pageAt: pages.length > 1 ? pageAt : null });
    return true;
  };
  const style = useMemo(
    () => ({
      "--bg": st.colors.bg,
      "--fg": st.colors.fg,
      "--accent": st.colors.accent,
      background: st.colors.bg,
      color: st.colors.fg,
      fontFamily: FONTS.be[1],
    }),
    [st.colors],
  );

  return (
    <div
      style={style}
      className="flex flex-col min-h-dvh transition-colors duration-300"
    >
      <header className="pt-[max(0.75rem,env(safe-area-inset-top))] flex justify-between items-center p-3 sm:p-4">
        <div className="opacity-80 font-semibold tracking-tight">
          <div className="md:hidden flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-zap preview-icon"
            >
              <path d="M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z" />
            </svg>
            RSVP
          </div>
          <div className="hidden md:flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-zap preview-icon"
            >
              <path d="M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z" />
            </svg>
            Rapid Serial Visual Presentation
          </div>
        </div>
        <div className="flex gap-2">
          <Btn
            label={t.github}
            href={REPO_URL}
            className="flex justify-center items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-github preview-icon"
            >
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
              <path d="M9 18c-4.51 2-5-2-7-2" />
            </svg>
          </Btn>
          <Btn
            className="font-semibold"
            label={st.lang === "vi" ? "English" : "Tiếng Việt"}
            onClick={() => st.set({ lang: st.lang === "vi" ? "en" : "vi" })}
          >
            {st.lang === "vi" ? "EN" : "VI"}
          </Btn>
          <Btn
            label={st.s.audioMuted ? t.unmute : t.mute}
            onClick={() => st.set({ audioMuted: !st.s.audioMuted })}
            className="flex justify-center items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={
                st.s.audioMuted ? { opacity: 0.6 } : { color: "var(--accent)" }
              }
              className={`lucide ${st.s.audioMuted ? "lucide-volume-x" : "lucide-volume-2"} preview-icon transition-colors duration-300`}
            >
              <path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" />
              {st.s.audioMuted ? (
                <>
                  <line x1="22" x2="16" y1="9" y2="15" />
                  <line x1="16" x2="22" y1="9" y2="15" />
                </>
              ) : (
                <>
                  <path d="M16 9a5 5 0 0 1 0 6" />
                  <path d="M19.364 18.364a9 9 0 0 0 0-12.728" />
                </>
              )}
            </svg>
          </Btn>
          <Btn
            label={t.theme}
            onClick={st.toggleTheme}
            className="flex justify-center items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-sun preview-icon"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2" />
              <path d="M12 20v2" />
              <path d="m4.93 4.93 1.41 1.41" />
              <path d="m17.66 17.66 1.41 1.41" />
              <path d="M2 12h2" />
              <path d="M20 12h2" />
              <path d="m6.34 17.66-1.41 1.41" />
              <path d="m19.07 4.93-1.41 1.41" />
            </svg>
          </Btn>
          <Btn
            label={t.settings}
            onClick={() => setShowSettings(true)}
            className="flex justify-center items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-settings preview-icon"
            >
              <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </Btn>
        </div>
      </header>
      <main className="flex flex-col flex-1">
        {doc ? (
          <Reader
            doc={doc}
            st={st}
            t={t}
            audio={audio}
            onBack={() => setDoc(null)}
          />
        ) : (
          <InputScreen t={t} onStart={start} />
        )}
      </main>
      {showSettings && (
        <SettingsPanel
          st={st}
          t={t}
          audio={audio}
          exp={exp}
          doc={doc}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
export function Btn({ label, onClick, href, children, className = "" }) {
  const cls = `min-w-9 h-9 cursor-pointer rounded-full border border-current/20 hover:bg-current/10 text-base active:scale-95 transition-[background-color,scale] ${className}`;
  if (href)
    return (
      <a
        aria-label={label}
        title={label}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cls}
      >
        {children}
      </a>
    );
  return (
    <button aria-label={label} title={label} onClick={onClick} className={cls}>
      {children}
    </button>
  );
}
