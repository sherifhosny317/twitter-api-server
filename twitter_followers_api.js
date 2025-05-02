const express = require("express");
const puppeteer = require("puppeteer-core");
const chromium  = require("chrome-aws-lambda");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/followers", async (req, res) => {
  const username = req.query.username;
  if (!username) return res.status(400).json({ error: "Username is required" });

  let browser;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
      defaultViewport: chromium.defaultViewport,
    });

    const page = await browser.newPage();
    await page.goto(`https://x.com/${username}`, { waitUntil: "networkidle2" });
    await page.waitForTimeout(2000);

    const followers = await page.evaluate(() => {
      const span = Array.from(document.querySelectorAll("a[href$='/followers'] span")).pop();
      return span ? span.innerText.trim() : "Unavailable";
    });

    res.json({ username, followers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (browser) await browser.close();
  }
});

app.get("/", (_req, res) => {
  res.send("🟢 API up — use /followers?username=XYZ");
});

app.listen(PORT, () => {
  console.log(`✅ API running on port ${PORT}`);
});
