import { splitWord, delayFor, isSentenceEnd, FONTS } from "./rsvp.js";

export const VIDEO_W = 1280;
export const VIDEO_H = 720;
export const FPS = 30;
export const MAX_PARTS = 12; // quá số phần này → bắt người dùng thu hẹp phạm vi
export const MAX_SINGLE_SEC = 30 * 60; // khi chọn "không chia" thì tối đa 30 phút

// Chia [from, to) thành các phần ≤ maxMin phút (xấp xỉ), ưu tiên cắt ở cuối câu.
// maxMin = 0 nghĩa là không chia.
export function planParts(words, from, to, wpm, maxMin) {
  const base = 60000 / wpm;
  const maxMs = maxMin > 0 ? maxMin * 60000 : Infinity;
  const parts = [];
  let start = from;
  let acc = 0;
  let total = 0;
  for (let i = from; i < to; i++) {
    const d = delayFor(words[i], base);
    acc += d;
    total += d;
    if (
      i < to - 1 &&
      acc >= maxMs &&
      (isSentenceEnd(words[i]) || acc >= maxMs * 1.15)
    ) {
      parts.push({ start, end: i + 1, ms: acc });
      start = i + 1;
      acc = 0;
    }
  }
  if (start < to) parts.push({ start, end: to, ms: acc });
  return { parts, totalMs: total };
}

// Vẽ một từ giống Reader: chữ ORP ở giữa, hai bên căn vào tâm, hai vạch đánh dấu.
export function makeRenderer(canvas, { colors, font, weight, size, sideOpacity }) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  const family = (FONTS[font] ?? FONTS.be)[1];
  const basePx = size * 1.6;
  const cx = W / 2;
  const cy = H / 2;
  const f = (px) => `${weight} ${px}px ${family}`;

  return (word) => {
    const { b, o, a } = splitWord(word);
    ctx.font = f(basePx);
    const avail = W * 0.46;
    const wide = Math.max(ctx.measureText(b).width, ctx.measureText(a).width);
    const px = wide > avail ? (basePx * avail) / wide : basePx;
    ctx.font = f(px);
    const wo = ctx.measureText(o).width;

    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, W, H);

    // hai vạch đánh dấu trên/dưới
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = colors.fg;
    ctx.fillRect(cx - 1.5, cy - 1.3 * px, 3, 0.45 * px);
    ctx.fillRect(cx - 1.5, cy + 0.85 * px, 3, 0.45 * px);

    ctx.textBaseline = "middle";
    ctx.globalAlpha = sideOpacity;
    ctx.fillStyle = colors.fg;
    ctx.textAlign = "right";
    ctx.fillText(b, cx - wo / 2, cy);
    ctx.textAlign = "left";
    ctx.fillText(a, cx + wo / 2, cy);

    ctx.globalAlpha = 1;
    ctx.fillStyle = colors.accent;
    ctx.textAlign = "center";
    ctx.fillText(o, cx, cy);
  };
}

async function ensureFonts(font, weight, text) {
  if (!document.fonts) return;
  const family = (FONTS[font] ?? FONTS.be)[1];
  const chars = Array.from(new Set(text)).join("");
  try {
    await document.fonts.load(`${weight} 64px ${family}`, chars);
  } catch {
    /* dùng font dự phòng */
  }
}

const tick = () => new Promise((r) => setTimeout(r));

// Tải và giải mã nhạc (URL hoặc blob: của file cục bộ) về AudioBuffer 48 kHz.
async function loadMusic(src) {
  try {
    const res = await fetch(src);
    if (!res.ok) throw new Error("http");
    const Ctx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    return await new Ctx(2, 1, 48000).decodeAudioData(await res.arrayBuffer());
  } catch {
    throw new Error("audioLoad");
  }
}

// Điền `dst` (Float32Array) bằng nhạc lặp vòng từ vị trí `pos`, nhân với `gain`.
// Trả về vị trí tiếp theo để các phần video nối tiếp bài nhạc liên tục.
export function fillLoop(dst, src, pos, gain) {
  let i = 0;
  let p = pos;
  while (i < dst.length) {
    const k = Math.min(dst.length - i, src.length - p);
    dst.set(src.subarray(p, p + k), i);
    i += k;
    p = (p + k) % src.length;
  }
  if (gain !== 1) for (let j = 0; j < dst.length; j++) dst[j] *= gain;
  return p;
}

// Xuất từng phần thành mp4, gọi onPart(blob, k, n) khi xong mỗi phần.
// Mỗi từ là một khung hình có thời lượng riêng (VFR) nên rất nhanh và nhẹ.
export async function exportVideo({
  words,
  parts,
  wpm,
  view,
  music, // { src, volume } hoặc null (video không tiếng)
  onProgress,
  onPart,
  shouldCancel,
}) {
  const mb = await import("mediabunny");
  if (!(await mb.canEncodeVideo("avc", { width: VIDEO_W, height: VIDEO_H })))
    throw new Error("unsupported");

  let musicBuf = null;
  let acodec = null;
  let ch = 2;
  if (music) {
    musicBuf = await loadMusic(music.src);
    ch = Math.min(2, musicBuf.numberOfChannels);
    acodec = await mb.getFirstEncodableAudioCodec(["aac", "opus"], {
      numberOfChannels: ch,
      sampleRate: musicBuf.sampleRate,
    });
    if (!acodec) throw new Error("audioUnsupported");
  }
  let musicPos = 0; // vị trí (mẫu) trong bài nhạc, giữ liên tục giữa các phần

  const canvas = document.createElement("canvas");
  canvas.width = VIDEO_W;
  canvas.height = VIDEO_H;
  const sample = parts.map((p) => words.slice(p.start, p.end).join(" ")).join(" ");
  await ensureFonts(view.font, view.weight, sample);
  const draw = makeRenderer(canvas, view);

  const base = 60000 / wpm;
  const total = parts.reduce((n, p) => n + p.end - p.start, 0);
  let done = 0;

  for (let k = 0; k < parts.length; k++) {
    const { start, end } = parts[k];
    const output = new mb.Output({
      format: new mb.Mp4OutputFormat({ fastStart: "in-memory" }),
      target: new mb.BufferTarget(),
    });
    const src = new mb.CanvasSource(canvas, {
      codec: "avc",
      quality: mb.QUALITY_MEDIUM,
      keyFrameInterval: 2,
    });
    output.addVideoTrack(src, { frameRate: FPS });
    const asrc = musicBuf
      ? new mb.AudioBufferSource({ codec: acodec, quality: mb.QUALITY_HIGH })
      : null;
    if (asrc) output.addAudioTrack(asrc);
    await output.start();

    // Lịch khung hình của phần này (khung kết thúc của từng từ)
    const ends = [];
    let prev = 0;
    let cum = 0;
    for (let i = start; i < end; i++) {
      cum += delayFor(words[i], base);
      prev = Math.max(prev + 1, Math.round((cum * FPS) / 1000));
      ends.push(prev);
    }
    const totalSec = prev / FPS;

    const videoTask = async () => {
      for (let i = start; i < end; i++) {
        if (shouldCancel()) return;
        const f0 = i === start ? 0 : ends[i - start - 1];
        draw(words[i]);
        await src.add(f0 / FPS, (ends[i - start] - f0) / FPS);
        done++;
        if (done % 25 === 0) {
          onProgress(done / total, k);
          await tick(); // nhường luồng cho giao diện cập nhật
        }
      }
      src.close();
    };
    // Nhạc nạp song song với hình, từng đoạn 1 giây, lặp lại nếu bài ngắn hơn video
    const audioTask = async () => {
      if (!asrc) return;
      const sr = musicBuf.sampleRate;
      for (let t = 0; t < totalSec; ) {
        if (shouldCancel()) return;
        const sec = Math.min(1, totalSec - t);
        const buf = new AudioBuffer({
          length: Math.max(1, Math.round(sec * sr)),
          numberOfChannels: ch,
          sampleRate: sr,
        });
        let next = musicPos;
        for (let c = 0; c < ch; c++)
          next = fillLoop(
            buf.getChannelData(c),
            musicBuf.getChannelData(c),
            musicPos,
            music.volume,
          );
        musicPos = next;
        await asrc.add(buf);
        t += sec;
      }
      asrc.close();
    };
    await Promise.all([videoTask(), audioTask()]);
    if (shouldCancel()) {
      await output.cancel();
      return false;
    }
    await output.finalize();
    await onPart(new Blob([output.target.buffer], { type: "video/mp4" }), k, parts.length);
  }
  onProgress(1, parts.length - 1);
  return true;
}
