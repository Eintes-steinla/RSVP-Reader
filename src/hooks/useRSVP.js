import { useCallback, useEffect, useState } from "react";
import { delayFor, isSentenceEnd } from "../rsvp.js";
export function useRSVP(words, wpm) {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const last = words.length - 1;
  useEffect(() => {
    if (!playing) return;
    if (i >= last) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(
      () => setI((x) => x + 1),
      delayFor(words[i], 60000 / wpm),
    );
    return () => clearTimeout(t);
  }, [playing, i, wpm, words, last]);
  const seek = useCallback((n) => setI(Math.max(0, Math.min(last, n))), [last]);
  const sentence = useCallback(
    (dir) => {
      if (dir > 0) {
        let j = i;
        while (j < last && !isSentenceEnd(words[j])) j++;
        setI(Math.min(last, j + 1));
      } else {
        let j = i - 2;
        while (j > 0 && !isSentenceEnd(words[j])) j--;
        setI(Math.max(0, j + 1));
      }
    },
    [i, words, last],
  );
  const toggle = useCallback(() => {
    if (i >= last) setI(0);
    setPlaying((p) => !p);
  }, [i, last]);
  const reset = useCallback(() => {
    setPlaying(false);
    setI(0);
  }, []);
  return { i, seek, playing, setPlaying, toggle, sentence, reset };
}
