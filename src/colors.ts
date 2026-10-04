// OKLab matrices: Björn Ottosson, https://bottosson.github.io/posts/oklab/
// Public UI uses familiar labels; stored colours remain portable sRGB hex.
export type Oklch = { l: number; c: number; h: number };
const clamp = (n: number, min = 0, max = 1) => Math.max(min, Math.min(max, n));
const linear = (n: number) =>
  n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
const encoded = (n: number) =>
  n <= 0.0031308 ? 12.92 * n : 1.055 * n ** (1 / 2.4) - 0.055;

export function normalizeHex(input: string): string | null {
  const value = input.trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(value))
    return (
      '#' +
      [...value]
        .map((c) => c + c)
        .join('')
        .toUpperCase()
    );
  return /^[0-9a-f]{6}$/i.test(value) ? '#' + value.toUpperCase() : null;
}

function channels(hex: string) {
  const valid = normalizeHex(hex);
  if (!valid) throw new Error('Expected a three- or six-digit RGB hex colour.');
  return [1, 3, 5].map((start) =>
    linear(parseInt(valid.slice(start, start + 2), 16) / 255),
  );
}

export function hexToOklch(hex: string): Oklch {
  const [r, g, b] = channels(hex);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const c = Math.hypot(a, bb);
  return {
    l: lightness,
    c,
    h: c < 0.00001 ? 0 : ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360,
  };
}

function toLinear({ l, c, h }: Oklch): number[] {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const ll = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * ll - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * ll + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * ll - 0.7034186147 * m + 1.707614701 * s,
  ];
}

export function oklchToHex(color: Oklch): string {
  const safe = { l: clamp(color.l), c: Math.max(0, color.c), h: color.h };
  let rgb = toLinear(safe);
  // Reduce chroma to the sRGB boundary, preserving lightness/hue instead of
  // clipping individual channels (which can visibly shift a selected hue).
  const inGamut = (values: number[]) =>
    values.every((n) => n >= -0.000001 && n <= 1.000001);
  if (!inGamut(rgb)) {
    let low = 0,
      high = safe.c;
    for (let i = 0; i < 20; i++) {
      const mid = (low + high) / 2;
      if (inGamut(toLinear({ ...safe, c: mid }))) low = mid;
      else high = mid;
    }
    rgb = toLinear({ ...safe, c: low });
  }
  return (
    '#' +
    rgb
      .map((n) =>
        Math.round(clamp(encoded(n)) * 255)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
      .toUpperCase()
  );
}

export function contrastOnBlack(hex: string): number {
  const [r, g, b] = channels(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b + 0.05) / 0.05;
}

export function checkmarkColor(hex: string): string {
  return contrastOnBlack(hex) >= Math.sqrt(21) ? '#000000' : '#FFFFFF';
}
