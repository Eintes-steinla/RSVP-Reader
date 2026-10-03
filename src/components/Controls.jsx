import { Btn } from "../App.jsx";
export default function Controls({ r, t, total, left, onZen }) {
  return (
    <div className="pb-[max(1rem,env(safe-area-inset-bottom))] space-y-3 sm:space-y-4 mx-auto px-4 sm:px-5 w-full max-w-2xl">
      <div>
        <input
          type="range"
          min={0}
          max={total - 1}
          value={r.i}
          onChange={(e) => r.seek(+e.target.value)}
          aria-label="Progress"
          className="w-full"
          style={{ accentColor: "var(--accent)" }}
        />
        <div className="flex justify-between opacity-70 tabular-nums text-xs">
          <span>
            {r.i + 1} / {total}
          </span>
          <span>{r.i >= total - 1 ? t.done : `${left} ${t.left}`}</span>
        </div>
      </div>
      <div className="flex justify-center items-center gap-2 sm:gap-3">
        <Btn
          label={t.reset}
          onClick={r.reset}
          className="flex justify-center items-center"
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
            className="lucide-rotate-ccw lucide preview-icon"
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </Btn>
        <Btn
          label={t.bs}
          onClick={() => r.sentence(-1)}
          className="flex justify-center items-center"
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
            className="lucide lucide-skip-back preview-icon"
          >
            <path d="M17.971 4.285A2 2 0 0 1 21 6v12a2 2 0 0 1-3.029 1.715l-9.997-5.998a2 2 0 0 1-.003-3.432z" />
            <path d="M3 20V4" />
          </svg>
        </Btn>
        <button
          aria-label={r.playing ? t.pause : t.play}
          onClick={r.toggle}
          className="flex justify-center items-center rounded-full w-16 [@media(max-height:500px)]:w-12 h-16 [@media(max-height:500px)]:h-12 text-2xl active:scale-95 transition cursor-pointer"
          style={{ background: "var(--accent)", color: "var(--bg)" }}
        >
          {r.playing ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-pause preview-icon"
            >
              <rect x="14" y="3" width="5" height="18" rx="1" />
              <rect x="5" y="3" width="5" height="18" rx="1" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-play preview-icon"
            >
              <path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" />
            </svg>
          )}
        </button>
        <Btn
          label={t.fs}
          onClick={() => r.sentence(1)}
          className="flex justify-center items-center"
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
            className="lucide lucide-skip-forward preview-icon"
          >
            <path d="M21 4v16" />
            <path d="M6.029 4.285A2 2 0 0 0 3 6v12a2 2 0 0 0 3.029 1.715l9.997-5.998a2 2 0 0 0 .003-3.432z" />
          </svg>
        </Btn>
        <Btn
          label={t.zen}
          onClick={onZen}
          className="flex justify-center items-center"
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
            className="lucide lucide-maximize preview-icon"
          >
            <path d="M8 3H5a2 2 0 0 0-2 2v3" />
            <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
            <path d="M3 16v3a2 2 0 0 0 2 2h3" />
            <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
          </svg>
        </Btn>
      </div>
    </div>
  );
}
