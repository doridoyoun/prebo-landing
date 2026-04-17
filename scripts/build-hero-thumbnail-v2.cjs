/**
 * Builds images/hero-thumbnail-v2.jpg (1200x630) for OG share:
 * hero background + optional PREBO logo + headline text.
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const root = path.join(__dirname, "..");
const OUT = path.join(root, "images", "hero-thumbnail-v2.jpg");
const W = 1200;
const H = 630;

function pickBackground() {
  const bg3 = path.join(root, "bg3.jpg");
  const fallback = path.join(root, "images", "hero-thumbnail.jpg");
  if (fs.existsSync(bg3)) return bg3;
  if (fs.existsSync(fallback)) return fallback;
  throw new Error("No background image: need bg3.jpg or images/hero-thumbnail.jpg");
}

function escapeXml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function main() {
  const bgPath = pickBackground();
  const logoPath = path.join(root, "images", "prebo-logo.png");
  const hasLogo = fs.existsSync(logoPath);

  const bgBuf = await sharp(bgPath)
    .resize(W, H, { fit: "cover", position: "center" })
    .jpeg({ quality: 92 })
    .toBuffer();

  const composites = [];

  if (hasLogo) {
    const logoBuf = await sharp(logoPath).resize({ width: 360 }).png().toBuffer();
    const meta = await sharp(logoBuf).metadata();
    const lw = meta.width || 360;
    const left = Math.round((W - lw) / 2);
    const top = 72;
    composites.push({ input: logoBuf, left, top });
  }

  const line1Y = hasLogo ? 360 : 260;
  const line2Y = hasLogo ? 430 : 330;
  const titleSize = 48;
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="heroTitleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#1e3470"/>
      <stop offset="52%" stop-color="#3f63d8"/>
      <stop offset="100%" stop-color="#5a78dc"/>
    </linearGradient>
  </defs>
  ${
    hasLogo
      ? ""
      : `<text x="${W / 2}" y="140" text-anchor="middle" font-family="Inter, Segoe UI, Arial, sans-serif" font-weight="800" font-size="64" fill="#1a2b4b">PREBO</text>`
  }
  <text x="${W / 2}" y="${line1Y}" text-anchor="middle" font-family="Inter, Segoe UI, Arial, sans-serif" font-weight="800" font-size="${titleSize}" fill="url(#heroTitleGrad)">${escapeXml(
    "Brand Activation"
  )}</text>
  <text x="${W / 2}" y="${line2Y}" text-anchor="middle" font-family="Inter, Segoe UI, Arial, sans-serif" font-weight="800" font-size="${titleSize}" fill="url(#heroTitleGrad)">${escapeXml(
    "& Marketing Agency"
  )}</text>
</svg>`;

  const textPng = await sharp(Buffer.from(svg)).png().toBuffer();
  composites.push({ input: textPng, left: 0, top: 0 });

  await sharp(bgBuf)
    .composite(composites)
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(OUT);

  console.log(
    "Wrote",
    OUT,
    "from",
    bgPath,
    hasLogo ? "with logo" : "wordmark text only"
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
