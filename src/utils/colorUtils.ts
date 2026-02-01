import type { RGBA, HSL } from "@/types";

/**
 * Convert hex color to RGBA
 */
export function hexToRgba(hex: string, alpha: number = 1): RGBA {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return { r: 0, g: 0, b: 0, a: alpha };
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
    a: alpha,
  };
}

/**
 * Convert RGBA to hex color
 */
export function rgbaToHex(rgba: RGBA): string {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(rgba.r)}${toHex(rgba.g)}${toHex(rgba.b)}`;
}

/**
 * Convert RGB to HSL
 */
export function rgbToHsl(r: number, g: number, b: number): HSL {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Convert HSL to RGB
 */
export function hslToRgb(h: number, s: number, l: number): RGBA {
  h /= 360;
  s /= 100;
  l /= 100;

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
    a: 1,
  };
}

/**
 * Check if two colors are similar within a tolerance
 */
export function colorsMatch(
  c1: RGBA,
  c2: RGBA,
  tolerance: number = 0
): boolean {
  return (
    Math.abs(c1.r - c2.r) <= tolerance &&
    Math.abs(c1.g - c2.g) <= tolerance &&
    Math.abs(c1.b - c2.b) <= tolerance &&
    Math.abs(c1.a - c2.a) <= tolerance / 255
  );
}

/**
 * Get color at a specific pixel from ImageData
 */
export function getPixelColor(
  imageData: ImageData,
  x: number,
  y: number
): RGBA {
  const index = (y * imageData.width + x) * 4;
  return {
    r: imageData.data[index],
    g: imageData.data[index + 1],
    b: imageData.data[index + 2],
    a: imageData.data[index + 3] / 255,
  };
}

/**
 * Set color at a specific pixel in ImageData
 */
export function setPixelColor(
  imageData: ImageData,
  x: number,
  y: number,
  color: RGBA
): void {
  const index = (y * imageData.width + x) * 4;
  imageData.data[index] = color.r;
  imageData.data[index + 1] = color.g;
  imageData.data[index + 2] = color.b;
  imageData.data[index + 3] = Math.round(color.a * 255);
}

/**
 * Blend two colors using alpha compositing
 */
export function blendColors(background: RGBA, foreground: RGBA): RGBA {
  const a = foreground.a + background.a * (1 - foreground.a);
  if (a === 0) {
    return { r: 0, g: 0, b: 0, a: 0 };
  }

  return {
    r: Math.round(
      (foreground.r * foreground.a + background.r * background.a * (1 - foreground.a)) / a
    ),
    g: Math.round(
      (foreground.g * foreground.a + background.g * background.a * (1 - foreground.a)) / a
    ),
    b: Math.round(
      (foreground.b * foreground.a + background.b * background.a * (1 - foreground.a)) / a
    ),
    a,
  };
}

/**
 * Generate a contrasting color for text/UI on a given background
 */
export function getContrastColor(backgroundColor: string): string {
  const rgb = hexToRgba(backgroundColor);
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
}

/**
 * Parse any color string to RGBA
 */
export function parseColor(color: string): RGBA {
  // Handle hex colors
  if (color.startsWith("#")) {
    return hexToRgba(color);
  }

  // Handle rgb/rgba colors
  const rgbaMatch = color.match(
    /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/
  );
  if (rgbaMatch) {
    return {
      r: parseInt(rgbaMatch[1]),
      g: parseInt(rgbaMatch[2]),
      b: parseInt(rgbaMatch[3]),
      a: rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1,
    };
  }

  // Default to black
  return { r: 0, g: 0, b: 0, a: 1 };
}

/**
 * Convert RGBA to CSS color string
 */
export function rgbaToCss(rgba: RGBA): string {
  return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`;
}
