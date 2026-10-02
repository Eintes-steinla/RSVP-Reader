import { memo, useEffect, useLayoutEffect, useRef, useState } from "react";

const W = 400; // số từ hiển thị mỗi phía quanh vị trí đọc

const Word = memo(function Word({ w, i, active, onPick }) {
  return (
    <>
      <button
        type="button"
        data-active={active || undefined}
        onClick={() => onPick(i)}
        className={`cursor-pointer rounded ${active ? "font-bold" : "hover:bg-current/10"}`}
        style={
          active
            ? { background: "var(--accent)", color: "var(--bg)" }
            : undefined
        }
      >
        {w}
      </button>{" "}
    </>
  );
});

export default function ContextPanel({
  words,
  pageAt,
  paraStarts,
  cur,
  onPick,
  onClose,
  t,
}) {
  const ref = useRef();
  const prevH = useRef(null);
  const skip = useRef(false);
  const around = (c) => [Math.max(0, c - W), Math.min(words.length, c + W)];
  const [win, setWin] = useState(() => around(cur));
  const [lo, hi] = win;

  // Khi vị trí đọc sắp ra khỏi cửa sổ thì dời cửa sổ theo
  useEffect(() => {
    if (cur < lo || (cur > hi - 30 && hi < words.length)) {
      skip.current = false;
      setWin(around(cur));
    }
  }, [cur]);
  useEffect(() => {
    if (skip.current) {
      skip.current = false;
      return;
    }
    ref.current
      ?.querySelector("[data-active]")
      ?.scrollIntoView({ block: "center" });
  }, [cur, win]);
  // Giữ nguyên vị trí cuộn khi chèn thêm nội dung phía trên
  useLayoutEffect(() => {
    if (prevH.current != null) {
      ref.current.scrollTop += ref.current.scrollHeight - prevH.current;
      prevH.current = null;
    }
  }, [lo]);

  const more = (dir) => {
    skip.current = true;
    if (dir < 0) {
      prevH.current = ref.current.scrollHeight;
      setWin([Math.max(0, lo - W), hi]);
    } else setWin([lo, Math.min(words.length, hi + W)]);
  };
  const MoreBtn = ({ dir }) => (
    <button
      onClick={() => more(dir)}
      className="flex items-center gap-1 hover:bg-current/10 mx-auto my-3 px-4 border border-current/20 rounded-full h-9 text-sm"
    >
      {dir < 0 ? (
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
          className="lucide lucide-move-up preview-icon"
        >
          <path d="M8 6L12 2L16 6" />
          <path d="M12 2V22" />
        </svg>
      ) : (
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
          className="lucide lucide-move-down preview-icon"
        >
          <path d="M8 18L12 22L16 18" />
          <path d="M12 2V22" />
        </svg>
      )}{" "}
      {t.more}
    </button>
  );

  return (
    <aside
      aria-label={t.context}
      className="md:right-0 bottom-0 md:left-auto z-20 fixed inset-x-0 md:inset-y-0 flex flex-col shadow-2xl border-current/20 border-t md:border-t-0 md:border-l md:rounded-none rounded-t-2xl md:w-[min(24rem,45vw)] h-[50dvh] md:h-auto"
      style={{ background: "var(--bg)" }}
    >
      <div className="flex justify-between items-center p-3 border-current/15 border-b">
        <b>{t.context}</b>
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
      <div
        ref={ref}
        className="pb-[max(1rem,env(safe-area-inset-bottom))] flex-1 p-4 overflow-y-auto overscroll-contain text-[15px] leading-8"
      >
        {lo > 0 && <MoreBtn dir={-1} />}
        {Array.from({ length: hi - lo }, (_, k) => {
          const i = lo + k;
          const page = pageAt?.get(i);
          return (
            <span key={i}>
              {page && (
                <span className="block opacity-50 mt-4 mb-2 font-semibold text-xs">
                  — {t.page} {page} —
                </span>
              )}
              {!page && i > lo && paraStarts.has(i) && (
                <span className="block h-4" />
              )}
              <Word w={words[i]} i={i} active={i === cur} onPick={onPick} />
            </span>
          );
        })}
        {hi < words.length && <MoreBtn dir={1} />}
      </div>
    </aside>
  );
}
