import { useRef, useState } from "react";
import { exportVideo } from "../video.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const idle = { busy: false, pct: 0, part: 0, parts: 0, err: "" };

function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// Sống ở App để đóng/mở Cài đặt không làm gián đoạn việc xuất video.
export function useExport() {
  const [state, setState] = useState(idle);
  const stop = useRef(false);
  const busy = useRef(false);

  const run = async ({ words, parts, wpm, view, music }) => {
    if (busy.current) return;
    busy.current = true;
    stop.current = false;
    setState({ ...idle, busy: true, part: 1, parts: parts.length });
    try {
      await exportVideo({
        words,
        parts,
        wpm,
        view,
        music,
        shouldCancel: () => stop.current,
        onProgress: (pct, k) => setState((s) => ({ ...s, pct, part: k + 1 })),
        onPart: async (blob, k, n) => {
          download(blob, n === 1 ? "rsvp-video.mp4" : `rsvp-video-part-${k + 1}-of-${n}.mp4`);
          if (k < n - 1) await sleep(500); // tránh trình duyệt chặn tải nhiều file liên tiếp
        },
      });
      setState(idle);
    } catch (e) {
      const known = ["unsupported", "audioLoad", "audioUnsupported"];
      setState({ ...idle, err: known.includes(e?.message) ? e.message : "fail" });
    } finally {
      busy.current = false;
    }
  };
  const cancel = () => {
    stop.current = true;
  };
  return { ...state, run, cancel };
}
