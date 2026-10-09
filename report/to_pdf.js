// SVGをA3横1枚のPDFにする。使い方: node to_pdf.js 入力.svg 出力.pdf
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

(async () => {
  const [svgPath, pdfPath] = process.argv.slice(2);
  const svg = fs.readFileSync(svgPath, "utf8")
    .replace(/width="[^"]*pt" height="[^"]*pt"/, 'width="420mm" height="297mm"');
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    @page { size: 420mm 297mm; margin: 0; }
    html, body { margin: 0; padding: 0; }
    svg { display: block; font-family: "Noto Sans CJK JP", sans-serif; }
  </style></head><body>${svg}</body></html>`;
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "load" });
  await page.pdf({ path: path.resolve(pdfPath), width: "420mm", height: "297mm",
                   printBackground: true, pageRanges: "1" });
  await browser.close();
})();
