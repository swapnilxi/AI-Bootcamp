import { chromium } from "playwright";

const outDir = "/private/tmp/claude-501/-Users-abundance-Documents-coding-AI-Bootcamp/7f72faf1-ed88-4b81-8b33-49d76a3220f2/scratchpad";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errs = [];
page.on("pageerror", (e) => errs.push(e.message));
await page.goto("http://localhost:3000", { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(800);
const height = await page.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < height; y += 300) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.waitForTimeout(200);
}

async function shoot(text, name) {
  const el = page.locator(`text=${text}`).first();
  await el.scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, -350));
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${outDir}/${name}.png` });
}

await shoot("Built by people who", "emblem-check");
await shoot("Learn, practise, build, ship", "process-check-1");

// Scroll a bit further into the process scene (horizontal scrub) to catch the rise-in.
const proc = page.locator("text=Learn, practise, build, ship").first();
await proc.scrollIntoViewIfNeeded();
await page.evaluate(() => window.scrollBy(0, -350));
await page.waitForTimeout(300);
for (let i = 0; i < 6; i++) {
  await page.mouse.wheel(0, 180);
  await page.waitForTimeout(250);
}
await page.waitForTimeout(400);
await page.screenshot({ path: `${outDir}/process-check-2.png` });

console.log("pageerrors:", JSON.stringify(errs));
await browser.close();
