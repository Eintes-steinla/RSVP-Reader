import { useEffect, useMemo, useRef, useState } from "react";
import { PRESETS, FONTS, contrast, loadFont } from "../rsvp.js";
import { planParts, MAX_PARTS, MAX_SINGLE_SEC } from "../video.js";

const fmtDur = (ms) => {
  const s = Math.round(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
};

export default function SettingsPanel({ st, t, audio, exp, doc, onClose }) {
  const { s, set, colors } = st;
  const fileRef = useRef();
  // Làm nóng sẵn các phông ở nền khi mở Cài đặt
  useEffect(() => {
    Object.keys(FONTS).forEach((k) => loadFont(k, s.weight));
  }, [s.weight]);
  const [badFile, setBadFile] = useState(false);
  const n = doc ? doc.words.length : 0;
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(n);
  const a = Math.min(Math.max(1, from || 1), Math.max(n, 1));
  const b = Math.min(Math.max(a, to || n), n);
  const plan = useMemo(
    () => (n ? planParts(doc.words, a - 1, b, s.wpm, s.exportPartMin) : null),
    [doc, n, a, b, s.wpm, s.exportPartMin],
  );
  const tooMany = plan && plan.parts.length > MAX_PARTS;
  const tooLong =
    plan && s.exportPartMin === 0 && plan.totalMs > MAX_SINGLE_SEC * 1000;
  const canExport = !!plan && !tooMany && !tooLong && !exp.busy;
  const startExport = () =>
    exp.run({
      words: doc.words,
      parts: plan.parts,
      wpm: s.wpm,
      view: {
        colors,
        font: s.font,
        weight: s.weight,
        size: s.size,
        sideOpacity: s.sideOpacity,
      },
      music:
        s.exportAudio && audio.src
          ? { src: audio.src, volume: s.audioVolume }
          : null,
    });
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
        <section className="space-y-3 pt-6 border-current/15 border-t">
          <h3 className="font-semibold">{t.reading}</h3>
          <label className="flex flex-col gap-1 text-sm">
            <div className="flex gap-1">
              {t.wpm}: <b>{s.wpm} WPM</b>
            </div>
            <input
              type="range"
              min={100}
              max={1000}
              step={10}
              value={s.wpm}
              onChange={(e) => set({ wpm: +e.target.value })}
              style={{ accentColor: "var(--accent)" }}
            />
          </label>
        </section>
        <section className="space-y-3 pt-6 border-current/15 border-t">
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
        <section className="space-y-3 pt-6 border-current/15 border-t">
          <h3 className="font-semibold">{t.font}</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(FONTS).map(([k, [name, css]]) => (
              <button
                key={k}
                onClick={() =>
                  loadFont(k, s.weight).then(() => set({ font: k }))
                }
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
            <span className="text-sm">{t.weight}:</span>
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
                  onClick={() =>
                    loadFont(s.font, w).then(() => set({ weight: w }))
                  }
                  aria-pressed={s.weight === w}
                  className="flex-1 rounded-full h-8 text-sm uppercase tracking-wide cursor-pointer"
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
          <label className="flex flex-col gap-1 text-sm">
            <div className="flex gap-1">
              {t.size}: <b>{s.size}px</b>
            </div>
            <input
              type="range"
              min={24}
              max={140}
              value={s.size}
              onChange={(e) => set({ size: +e.target.value })}
              style={{ accentColor: "var(--accent)" }}
            />
          </label>
        </section>
        <section className="space-y-3 pt-6 border-current/15 border-t">
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
        <section className="space-y-3 pt-6 border-current/15 border-t">
          <h3 className="flex items-center font-semibold">{t.audio}</h3>
          <div className="flex gap-2">
            <input
              type="url"
              value={audio.file ? "" : s.audioUrl}
              onChange={(e) => audio.setUrl(e.target.value)}
              placeholder={audio.file ? audio.file.name : "https://…/music.mp3"}
              aria-label={t.audioUrl}
              className="flex-1 bg-transparent px-3 border border-current/20 rounded-full min-w-0 h-10 text-sm"
            />
            <button
              onClick={audio.reset}
              className="hover:bg-current/10 px-4 border border-current/20 rounded-full h-10 font-semibold text-sm uppercase cursor-pointer"
            >
              {t.audioReset}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm">{t.audioLocal}</span>
            <button
              onClick={() => fileRef.current.click()}
              className="hover:bg-current/10 px-4 border border-current/20 rounded-full h-10 font-semibold text-sm uppercase cursor-pointer"
            >
              {t.audioChoose}
            </button>
            {audio.file && (
              <span className="opacity-70 text-sm truncate">
                {audio.file.name}
              </span>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="audio/*"
              hidden
              onChange={(e) => {
                setBadFile(
                  !audio.pickFile(e.target.files[0]) && !!e.target.files[0],
                );
                e.target.value = "";
              }}
            />
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <div className="flex gap-1">
              {t.audioVol}: <b>{Math.round(s.audioVolume * 100)}%</b>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={s.audioVolume}
              onChange={(e) => set({ audioVolume: +e.target.value })}
              style={{ accentColor: "var(--accent)" }}
            />
          </label>
          {(audio.err || badFile) && (
            <p
              role="alert"
              className="font-medium text-sm"
              style={{ color: "var(--accent)" }}
            >
              {badFile ? t.audioNotAudio : t.audioErr}
            </p>
          )}
        </section>
        <section className="space-y-3 pt-6 border-current/15 border-t">
          <h3 className="font-semibold">{t.video}</h3>
          {!doc ? (
            <p className="opacity-60 text-sm">{t.videoNoDoc}</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <label className="flex items-center gap-2">
                  {t.videoFrom}
                  <input
                    type="number"
                    min={1}
                    max={n}
                    value={from}
                    onChange={(e) => setFrom(+e.target.value)}
                    className="bg-transparent px-2 border border-current/20 rounded-lg w-24 h-9 tabular-nums"
                  />
                </label>
                <label className="flex items-center gap-2">
                  {t.videoTo}
                  <input
                    type="number"
                    min={1}
                    max={n}
                    value={to}
                    onChange={(e) => setTo(+e.target.value)}
                    className="bg-transparent px-2 border border-current/20 rounded-lg w-24 h-9 tabular-nums"
                  />
                </label>
                <span className="opacity-60 tabular-nums">/ {n}</span>
              </div>
              <div className="space-y-2">
                <div className="text-sm">{t.videoPart}</div>
                <div className="flex flex-wrap gap-2">
                  {[1, 3, 5, 10].map((m) => (
                    <Chip
                      key={m}
                      active={s.exportPartMin === m}
                      onClick={() => set({ exportPartMin: m })}
                    >
                      {m} {t.videoMin}
                    </Chip>
                  ))}
                  <Chip
                    active={s.exportPartMin === 0}
                    onClick={() => set({ exportPartMin: 0 })}
                  >
                    {t.videoNoSplit}
                  </Chip>
                </div>
              </div>
              {audio.src && (
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={s.exportAudio}
                    onChange={(e) => set({ exportAudio: e.target.checked })}
                    style={{ accentColor: "var(--accent)" }}
                  />
                  {t.videoAudio}
                </label>
              )}
              {plan && (
                <p className="opacity-70 tabular-nums text-sm">
                  {t.videoEst}: {fmtDur(plan.totalMs)} | {plan.parts.length}{" "}
                  {t.videoParts} | {s.wpm} WPM
                </p>
              )}
              {(tooMany || tooLong) && (
                <p
                  role="alert"
                  className="font-medium text-sm"
                  style={{ color: "var(--accent)" }}
                >
                  {tooMany ? t.videoTooMany : t.videoTooLong}
                </p>
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={startExport}
                  disabled={!canExport}
                  className="flex flex-1 justify-center items-center gap-2 enabled:hover:bg-current/10 disabled:opacity-60 border border-current/20 rounded-xl h-12 font-semibold text-sm uppercase tracking-wide enabled:cursor-pointer disabled:cursor-not-allowed"
                >
                  {exp.busy ? (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        strokeWidth="3"
                        strokeLinecap="round"
                        className="animate-spin"
                        aria-hidden
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="9"
                          stroke="currentColor"
                          opacity="0.2"
                        />
                        <path d="M21 12a9 9 0 0 0-9-9" stroke="var(--accent)" />
                      </svg>
                      {t.videoBusy} {Math.round(exp.pct * 100)}%
                      {exp.parts > 1 && (
                        <span className="opacity-60 normal-case">
                          ({t.videoPartOf} {exp.part}/{exp.parts})
                        </span>
                      )}
                    </>
                  ) : (
                    <>
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
                        aria-hidden
                      >
                        <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
                        <rect x="2" y="6" width="14" height="12" rx="2" />
                      </svg>
                      {t.videoExport}
                    </>
                  )}
                </button>
                {exp.busy && (
                  <button
                    onClick={exp.cancel}
                    className="hover:bg-current/10 px-4 border border-current/20 rounded-xl h-12 font-semibold text-sm uppercase cursor-pointer"
                  >
                    {t.videoCancel}
                  </button>
                )}
              </div>
              <p className="opacity-50 text-xs">{t.videoHint}</p>
              {exp.err && (
                <p
                  role="alert"
                  className="font-medium text-sm"
                  style={{ color: "var(--accent)" }}
                >
                  {{
                    unsupported: t.videoUnsupported,
                    audioLoad: t.videoAudioLoad,
                    audioUnsupported: t.videoAudioUnsupported,
                  }[exp.err] ?? t.videoFail}
                </p>
              )}
            </>
          )}
        </section>
        <section className="space-y-3 pt-6 border-current/15 border-t">
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
