export const tokenize = (t) => (t.normalize('NFC').match(/\S+/g) || [])

// ORP: vị trí chữ nhấn, bỏ qua dấu câu ở đầu/cuối từ
export function splitWord(w) {
  const ch = Array.from(w)
  const isL = (c) => /[\p{L}\p{N}]/u.test(c)
  let s = ch.findIndex(isL)
  if (s < 0) return { b: '', o: ch[0] || '', a: ch.slice(1).join('') }
  let e = ch.length - 1
  while (e > s && !isL(ch[e])) e--
  const n = e - s + 1
  const k = s + (n <= 1 ? 0 : n <= 5 ? 1 : n <= 9 ? 2 : n <= 13 ? 3 : 4)
  return { b: ch.slice(0, k).join(''), o: ch[k], a: ch.slice(k + 1).join('') }
}

export function delayFor(w, base) {
  const len = Array.from(w).length
  let f = 1
  if (/[.!?…]["'”’)\]]*$/.test(w)) f = 2.2
  else if (/[,;:]["'”’)\]]*$/.test(w)) f = 1.5
  if (len > 8) f += 0.3
  if (len > 12) f += 0.3
  return base * f
}

export const isSentenceEnd = (w) => /[.!?…]["'”’)\]]*$/.test(w)

export const PRESETS = {
  paper: { bg: '#faf8f3', fg: '#1f1f1f', accent: '#d63e3e' },
  dark: { bg: '#121214', fg: '#ececec', accent: '#ff6b6b' },
  sepia: { bg: '#f4ecd8', fg: '#433422', accent: '#b5472a' },
  contrast: { bg: '#000000', fg: '#ffffff', accent: '#ffe600' },
  terminal: { bg: '#0a0f0a', fg: '#33ff66', accent: '#ffffff' },
}
const lum = (h) => {
  const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
export const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }

export const FONTS = {
  be: ['Be Vietnam Pro', "'Be Vietnam Pro', system-ui, sans-serif"],
  lexend: ['Lexend', "'Lexend', system-ui, sans-serif"],
  source: ['Source Serif 4', "'Source Serif 4', Georgia, serif"],
  mono: ['JetBrains Mono', "'JetBrains Mono', ui-monospace, Consolas, monospace"],
  inter: ['Inter', "'Inter', system-ui, sans-serif"],
}

const median = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)] || 0 }

// Chia 2 cột nếu có "rãnh" dọc gần như không có chữ nào cắt ngang
function splitColumns(items, width) {
  if (items.length < 40) return [items]
  let best = Infinity, xs = []
  for (let x = width * 0.35; x <= width * 0.65; x += width / 100) {
    const cross = items.filter((i) => i.x < x && i.x + i.w > x).length
    const l = items.filter((i) => i.x + i.w <= x).length
    const r = items.filter((i) => i.x >= x).length
    if (l < items.length * 0.25 || r < items.length * 0.25 || cross > items.length * 0.05) continue
    if (cross < best) { best = cross; xs = [x] } else if (cross === best) xs.push(x)
  }
  if (!xs.length) return [items]
  const cut = xs[Math.floor(xs.length / 2)]
  return [items.filter((i) => i.x < cut), items.filter((i) => i.x >= cut)]
}

function linesOf(items) {
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x)
  const lines = []
  for (const it of sorted) {
    const L = lines[lines.length - 1]
    if (L && Math.abs(L.y - it.y) < Math.max(L.h, it.h) * 0.5) L.items.push(it)
    else lines.push({ y: it.y, h: it.h, items: [it] })
  }
  return lines.map((L) => {
    L.items.sort((a, b) => a.x - b.x)
    let text = '', end = null
    for (const it of L.items) {
      if (end !== null && it.x - end > L.h * 0.15 && !text.endsWith(' ') && !it.s.startsWith(' ')) text += ' '
      text += it.s; end = it.x + it.w
    }
    return { y: L.y, text: text.replace(/\s+/g, ' ').trim() }
  }).filter((l) => l.text)
}

// Gộp dòng thành đoạn (khoảng cách dòng lớn bất thường = đoạn mới), nối từ bị ngắt dòng bằng dấu gạch
function paragraphs(lines) {
  if (!lines.length) return []
  const typical = median(lines.slice(1).map((l, i) => lines[i].y - l.y).filter((g) => g > 0)) || 12
  const out = []; let cur = ''
  lines.forEach((l, i) => {
    if (i && lines[i - 1].y - l.y > typical * 1.5) { out.push(cur); cur = '' }
    if (/\p{L}-$/u.test(cur) && /^\p{Ll}/u.test(l.text)) cur = cur.slice(0, -1) + l.text
    else cur = cur ? cur + ' ' + l.text : l.text
  })
  out.push(cur)
  return out.filter(Boolean)
}

// Trả về mảng trang; mỗi trang là mảng đoạn văn
export async function extractPdf(file, onProgress) {
  const pdfjs = await import('pdfjs-dist')
  const worker = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
  pdfjs.GlobalWorkerOptions.workerSrc = worker
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise
  const pages = []
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p)
    const width = page.getViewport({ scale: 1 }).width
    const tc = await page.getTextContent()
    const items = tc.items.filter((i) => i.str && i.str.trim())
      .map((i) => ({ s: i.str, x: i.transform[4], y: i.transform[5], w: i.width, h: Math.abs(i.height) || Math.abs(i.transform[3]) || 10 }))
    pages.push(splitColumns(items, width).flatMap((c) => paragraphs(linesOf(c))))
    onProgress(p / pdf.numPages)
  }
  return pages
}
