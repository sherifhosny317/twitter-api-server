const express = require("express");
const chromium = require("chrome-aws-lambda");
const app = express();

app.get("/followers", async (req, res) => {
  const username = req.query.username;
  if (!username) return res.status(400).send("Missing username");

  let browser = null;
  try {
    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.goto(`https://x.com/${username}`, { waitUntil: "networkidle2" });

    await page.waitForTimeout(3000);

    const followers = await page.evaluate(() => {
      const span = [...document.querySelectorAll("a[href$='/followers'] span")].pop();
      return span ? span.innerText : "Unavailable";
    });

    res.json({ username, followers });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(3000, () => console.log("✅ Puppeteer Core API running on port 3000"));