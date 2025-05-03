const express = require("express");
const puppeteer = require("puppeteer");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static("public"));
app.use(express.json());

app.post("/scrape", async (req, res) => {
  const tweetURL = req.body.url;

  if (!tweetURL || !tweetURL.includes("twitter.com") && !tweetURL.includes("x.com")) {
    return res.json({ error: "Invalid Twitter URL" });
  }

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  try {
    const page = await browser.newPage();
    await page.goto(tweetURL, { waitUntil: "networkidle2" });

    const username = await page.$eval('div[data-testid="User-Name"] a[href^="/"]', el => el.textContent.trim());

    let content = "Unavailable";
    try {
      await page.waitForSelector('[data-testid="tweetText"]', { timeout: 5000 });
      content = await page.$eval('[data-testid="tweetText"]', el => el.innerText.trim());
    } catch (e) {}

    const profileURL = "https://twitter.com/" + username.replace("@", "");
    await page.goto(profileURL, { waitUntil: "networkidle2" });

    let followers = "Unavailable";
    try {
      await page.waitForSelector('a[href$="/followers"] > span > span', { timeout: 5000 });
      followers = await page.$eval('a[href$="/followers"] > span > span', el => el.textContent.trim());
    } catch (e) {}

    res.json({
      platform: "X (formerly Twitter)",
      url: tweetURL,
      username,
      content,
      followers,
    });
  } catch (error) {
    res.json({ error: "Scraping failed" });
  } finally {
    await browser.close();
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
