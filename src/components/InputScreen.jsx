import { useEffect, useRef, useState } from "react";
import { tokenize, extractPdf } from "../rsvp.js";

export default function InputScreen({ t, onStart }) {
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const [prog, setProg] = useState(null);
  const [over, setOver] = useState(false);
  const fileRef = useRef();
  const n = tokenize(text).length;

  const handleFile = async (f) => {
    if (!f) return;
    if (f.type !== "application/pdf" && !/\.pdf$/i.test(f.name))
      return setErr(t.notPdf);
    setErr("");
    setProg(0);
    try {
      const pages = await extractPdf(f, setProg);
      setProg(null);
      if (!pages.flat().join("").trim()) return setErr(t.scan);
      onStart(pages);
    } catch {
      setProg(null);
      setErr(t.bad);
    }
  };
  useEffect(() => {
    const h = (e) => {
      const f = [...(e.clipboardData?.files || [])][0];
      if (f) {
        e.preventDefault();
        handleFile(f);
      }
    };
    window.addEventListener("paste", h);
    return () => window.removeEventListener("paste", h);
  });
  const go = () => {
    if (!n) return setErr(t.empty);
    setErr("");
    onStart([text.split(/\n\s*\n/)]);
  };

  return (
    <div className="pb-[max(3rem,env(safe-area-inset-bottom))] flex flex-col gap-6 mx-auto px-4 sm:px-5 w-full max-w-2xl">
      <div className="pt-4 pb-2 text-center">
        <h1 className="font-bold text-3xl sm:text-5xl tracking-tight">
          {t.title}
        </h1>
        <p className="opacity-70 mt-3">{t.sub}</p>
      </div>
      <label className="flex flex-col gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t.ph}
          rows={9}
          className="bg-transparent p-4 border border-current/20 rounded-2xl w-full text-base leading-relaxed resize-y"
        />
      </label>
      <div className="flex flex-wrap justify-between items-center gap-3">
        <span className="opacity-70 text-sm">
          {n} {t.words} ~ {Math.max(1, Math.ceil(n / 300))} {t.min}
        </span>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setText(t.sampleText)}
            className="flex-1 sm:flex-none hover:bg-current/10 px-4 border border-current/20 rounded-full h-10 text-sm sm:text-base"
          >
            {t.sample}
          </button>
          <button
            onClick={go}
            className="flex-1 sm:flex-none px-6 rounded-full h-10 font-semibold text-sm sm:text-base"
            style={{ background: "var(--accent)", color: "var(--bg)" }}
          >
            {t.start}
          </button>
        </div>
      </div>
      <div className="opacity-60 text-sm text-center">{t.pdf}</div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => fileRef.current.click()}
        onKeyDown={(e) =>
          (e.key === "Enter" || e.key === " ") && fileRef.current.click()
        }
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          handleFile(e.dataTransfer.files[0]);
        }}
        className={`rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center cursor-pointer transition ${over ? "bg-current/10 border-current" : "border-current/30"}`}
      >
        {prog !== null ? (
          <div
            role="progressbar"
            aria-valuenow={Math.round(prog * 100)}
            className="space-y-2"
          >
            <div>
              {t.busy} {Math.round(prog * 100)}%
            </div>
            <div className="bg-current/15 rounded-full h-2 overflow-hidden">
              <div
                className="h-full transition-all"
                style={{ width: `${prog * 100}%`, background: "var(--accent)" }}
              />
            </div>
          </div>
        ) : (
          t.drop
        )}
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf,.pdf"
          hidden
          onChange={(e) => {
            handleFile(e.target.files[0]);
            e.target.value = "";
          }}
        />
      </div>
      {err && (
        <p
          role="alert"
          className="font-medium text-center"
          style={{ color: "var(--accent)" }}
        >
          {err}
        </p>
      )}
    </div>
  );
}
