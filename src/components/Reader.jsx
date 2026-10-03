import { useEffect, useRef, useState } from "react";
import { useRSVP } from "../hooks/useRSVP.js";
import { splitWord, FONTS } from "../rsvp.js";
import Controls from "./Controls.jsx";
import ContextPanel from "./ContextPanel.jsx";

export default function Reader({ doc, st, t, onBack }) {
  const { words, pageAt, paraStarts } = doc;
  const { wpm, size, font, weight, sideOpacity } = st.s;
  const r = useRSVP(words, wpm);
  const [ctx, setCtx] = useState(false);
  const [show, setShow] = useState(true);
  const timer = useRef();
  const wake = () => {
    setShow(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setShow(false), 2500);
  };
  useEffect(() => {
    if (!r.playing) {
      setShow(true);
      clearTimeout(timer.current);
    } else wake();
  }, [r.playing]);

  useEffect(() => {
    const h = (e) => {
      if (
        ["INPUT", "TEXTAREA"].includes(e.target.tagName) &&
        e.key !== "Escape"
      )
        return;
      const k = e.key;
      if (k === " " && e.target.tagName !== "BUTTON") {
        e.preventDefault();
        r.toggle();
      } else if (k === "ArrowLeft" && e.target.type !== "range") {
        e.preventDefault();
        r.seek(r.i - 10);
      } else if (k === "ArrowRight" && e.target.type !== "range") {
        e.preventDefault();
        r.seek(r.i + 10);
      } else if (k === "ArrowUp") {
        e.preventDefault();
        st.set({ wpm: Math.min(1000, wpm + 25) });
      } else if (k === "ArrowDown") {
        e.preventDefault();
        st.set({ wpm: Math.max(100, wpm - 25) });
      } else if (k === "Escape") onBack();
      wake();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  const { b, o, a } = splitWord(words[r.i]);
  const side = Math.max(Array.from(b).length, Array.from(a).length, 1);
  const fs = `min(${size}px, ${(76 / side).toFixed(2)}vw)`; // từ dài tự thu nhỏ để không tràn màn hình hẹp
  const hidden = r.playing && !show;
  const left = Math.ceil(((words.length - r.i) / wpm) * 60);
  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div
      className={`flex-1 flex flex-col ${ctx ? "pb-[50dvh] md:pb-0 md:pr-[min(24rem,45vw)]" : ""}`}
      onMouseMove={wake}
      onTouchStart={wake}
    >
      <div
        className={`px-4 flex items-center justify-between text-sm transition-opacity duration-500 ${hidden ? "opacity-0" : "opacity-70"}`}
      >
        <button
          onClick={onBack}
          className="flex items-center gap-1 hover:bg-current/10 px-3 rounded-full h-10"
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
            className="lucide-move-left lucide preview-icon"
          >
            <path d="M6 8L2 12L6 16" />
            <path d="M2 12H22" />
          </svg>{" "}
          {t.back}
        </button>
        <button
          onClick={() => setCtx((v) => !v)}
          className="flex items-center gap-1 hover:bg-current/10 px-3 rounded-full h-10"
          aria-pressed={ctx}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-menu preview-icon"
          >
            <path d="M4 5h16" />
            <path d="M4 12h16" />
            <path d="M4 19h16" />
          </svg>{" "}
          {t.context}
        </button>
      </div>
      <button
        onClick={r.toggle}
        className="flex flex-1 justify-center items-center min-h-[30dvh] [@media(max-height:500px)]:min-h-0 overflow-hidden cursor-pointer"
        aria-live="off"
      >
        <div
          className="relative grid grid-cols-[1fr_auto_1fr] w-full leading-none whitespace-pre select-none"
          style={{
            fontSize: fs,
            fontFamily: FONTS[font]?.[1] ?? FONTS.be[1],
            fontWeight: weight,
          }}
        >
          <span
            aria-hidden
            className="top-[-0.8em] left-1/2 absolute opacity-40 w-0.5 h-[0.45em] -translate-x-1/2"
            style={{ background: "var(--fg)" }}
          />
          <span
            aria-hidden
            className="bottom-[-0.8em] left-1/2 absolute opacity-40 w-0.5 h-[0.45em] -translate-x-1/2"
            style={{ background: "var(--fg)" }}
          />
          <span className="text-right" style={{ opacity: sideOpacity }}>
            {b}
          </span>
          <span style={{ color: "var(--accent)" }}>{o}</span>
          <span className="text-left" style={{ opacity: sideOpacity }}>
            {a}
          </span>
        </div>
      </button>
      <div
        className={`transition-opacity duration-500 ${hidden ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      >
        <Controls r={r} t={t} total={words.length} left={fmt(left)} />
        <p className="hidden sm:block opacity-50 pb-4 text-xs text-center">
          {t.keys}
        </p>
      </div>
      {ctx && (
        <ContextPanel
          words={words}
          pageAt={pageAt}
          paraStarts={paraStarts}
          cur={r.i}
          onPick={r.seek}
          onClose={() => setCtx(false)}
          t={t}
        />
      )}
    </div>
  );
}
