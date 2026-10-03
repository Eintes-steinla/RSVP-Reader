import { useCallback, useEffect, useRef, useState } from "react";

export const DEFAULT_AUDIO_URL =
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

// Một phần tử <audio> duy nhất, sống ở App để không bị ngắt khi mở/đóng Cài đặt.
export function useAudio(s, set) {
  const el = useRef(null);
  if (!el.current) {
    el.current = new Audio();
    el.current.loop = true;
    el.current.preload = "none";
  }
  const want = useRef(false); // Reader đang yêu cầu phát
  const [file, setFile] = useState(null); // { name, url } — file cục bộ (ưu tiên hơn URL)
  const [err, setErr] = useState(false);

  const src = file?.url || (s.audioUrl || "").trim();

  const tryPlay = () => {
    const a = el.current;
    if (!want.current || !a.getAttribute("src")) return;
    a.play().catch(() => {});
  };

  useEffect(() => {
    const a = el.current;
    setErr(false);
    if (src) {
      a.src = src;
      tryPlay();
    } else {
      a.removeAttribute("src");
      a.load();
    }
  }, [src]);

  useEffect(() => {
    el.current.volume = s.audioVolume;
  }, [s.audioVolume]);

  useEffect(() => {
    el.current.muted = s.audioMuted;
  }, [s.audioMuted]);

  useEffect(() => {
    const a = el.current;
    const onErr = () => a.getAttribute("src") && setErr(true);
    a.addEventListener("error", onErr);
    return () => {
      a.removeEventListener("error", onErr);
      a.pause();
    };
  }, []);

  useEffect(
    () => () => {
      if (file?.url) URL.revokeObjectURL(file.url);
    },
    [file],
  );

  const play = useCallback(() => {
    want.current = true;
    tryPlay();
  }, []);
  const pause = useCallback(() => {
    want.current = false;
    el.current.pause();
  }, []);

  // Nhập URL → bỏ file cục bộ
  const setUrl = (v) => {
    setFile(null);
    set({ audioUrl: v });
  };
  const pickFile = (f) => {
    if (!f) return false;
    if (!f.type.startsWith("audio/") && !/\.(mp3|wav|ogg|m4a|aac|flac|opus)$/i.test(f.name))
      return false;
    setFile({ name: f.name, url: URL.createObjectURL(f) });
    return true;
  };
  const reset = () => {
    setFile(null);
    set({ audioUrl: DEFAULT_AUDIO_URL });
  };

  return { play, pause, setUrl, pickFile, reset, file, err };
}
