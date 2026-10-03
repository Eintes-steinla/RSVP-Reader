import { PRESETS, FONTS, contrast } from "../rsvp.js";

export default function SettingsPanel({ st, t, onClose }) {
  const { s, set, colors } = st;
  const low =
    contrast(colors.bg, colors.fg) < 4.5 ||
    contrast(colors.bg, colors.accent) < 3;
  const pick = (k, v) =>
    set({ preset: "custom", custom: { ...colors, [k]: v } });
  const Chip = ({ active, onClick, children }) => (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`h-10 px-3 rounded-full border text-sm ${active ? "border-2 font-semibold" : "border-current/20 hover:bg-current/10"}`}
      style={active ? { borderColor: "var(--accent)" } : undefined}
    >
      {children}
    </button>
  );
  return (
    <div
      className="z-30 fixed inset-0 flex justify-end bg-black/40"
      onClick={onClose}
    >
      <aside
        role="dialog"
        aria-label={t.settings}
        onClick={(e) => e.stopPropagation()}
        className="pb-[max(1.25rem,env(safe-area-inset-bottom))] space-y-6 shadow-2xl p-5 w-full max-w-sm h-full overflow-y-auto overscroll-contain"
        style={{ background: "var(--bg)" }}
      >
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-xl">{t.settings}</h2>
          <button
            aria-label={t.close}
            onClick={onClose}
            className="flex justify-center items-center hover:bg-current/10 rounded-full w-10 h-10 cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-x preview-icon"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
        <section className="space-y-3">
          <h3 className="font-semibold">{t.colors}</h3>
          <div className="flex flex-wrap gap-2">
            {["auto", ...Object.keys(PRESETS)].map((k) => (
              <Chip
                key={k}
                active={s.preset === k}
                onClick={() =>
                  set({
                    preset: k,
                    ...(k !== "auto" ? { custom: { ...PRESETS[k] } } : {}),
                  })
                }
              >
                {t.preset[k]}
              </Chip>
            ))}
          </div>
          <div className="gap-3 grid grid-cols-3 text-sm">
            {["bg", "fg", "accent"].map((k) => (
              <label key={k} className="flex flex-col gap-1">
                {t[k]}
                <input
                  type="color"
                  value={colors[k]}
                  onChange={(e) => pick(k, e.target.value)}
                  className="bg-transparent rounded w-full h-10 cursor-pointer"
                />
              </label>
            ))}
          </div>
          {low && (
            <p
              role="alert"
              className="font-medium text-sm"
              style={{ color: "var(--accent)" }}
            >
              ⚠ {t.low}
            </p>
          )}
        </section>
        <section className="space-y-3">
          <h3 className="font-semibold">{t.font}</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(FONTS).map(([k, [name, css]]) => (
              <button
                key={k}
                onClick={() => set({ font: k })}
                aria-pressed={s.font === k}
                className={`h-10 px-3 rounded-full border text-sm ${s.font === k ? "border-2" : "border-current/20 hover:bg-current/10"}`}
                style={{
                  fontFamily: css,
                  ...(s.font === k ? { borderColor: "var(--accent)" } : {}),
                }}
              >
                {name}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="font-semibold tracking-wide">{t.weight}</span>
            <div
              role="group"
              aria-label={t.weight}
              className="flex flex-1 gap-1 p-1 border border-current/20 rounded-full"
            >
              {[
                [500, t.weightNormal],
                [700, t.weightBold],
              ].map(([w, label]) => (
                <button
                  key={w}
                  onClick={() => set({ weight: w })}
                  aria-pressed={s.weight === w}
                  className="flex-1 rounded-full h-9 text-sm uppercase tracking-wide cursor-pointer"
                  style={
                    s.weight === w
                      ? {
                          background: "var(--fg)",
                          color: "var(--bg)",
                          fontWeight: w,
                        }
                      : { opacity: 0.6, fontWeight: w }
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>
        <section className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">{t.sideOpacity}</h3>
            <span className="opacity-60 tabular-nums text-sm">
              {+s.sideOpacity.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={s.sideOpacity}
            onChange={(e) => set({ sideOpacity: +e.target.value })}
            aria-label={t.sideOpacity}
            className="w-full"
            style={{ accentColor: "var(--accent)" }}
          />
          <div className="flex justify-between opacity-60 text-xs uppercase tracking-wide">
            <span>{t.ghost}</span>
            <span>{t.solid}</span>
          </div>
        </section>
        <section className="space-y-3">
          <h3 className="font-semibold">{t.lang}</h3>
          <div className="flex gap-2">
            <Chip active={st.lang === "vi"} onClick={() => set({ lang: "vi" })}>
              Tiếng Việt
            </Chip>
            <Chip active={st.lang === "en"} onClick={() => set({ lang: "en" })}>
              English
            </Chip>
          </div>
        </section>
      </aside>
    </div>
  );
}
