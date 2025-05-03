const express = require("express");
const puppeteer = require("puppeteer");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));
app.use(express.json());

function convertToFullLink(url) {
  return url.replace("x.com", "twitter.com").replace("mobile.twitter.com", "twitter.com");
}

function formatFollowers(text) {
  if (!text) return "Unavailable";
  const num = parseFloat(text.replace(/,/g, ""));
  if (text.toLowerCase().includes("m")) return (num * 1_000_000).toLocaleString();
  if (text.toLowerCase().includes("k")) return (num * 1_000).toLocaleString();
  return num.toLocaleString();
}

app.post("/scrape", async (req, res) => {
  const tweetUrl = req.body.url;
  if (!tweetUrl) return res.status(400).json({ error: "No URL provided" });

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.goto(tweetUrl, { waitUntil: "networkidle2", timeout: 60000 });

    await page.waitForTimeout(3000);

    const data = await page.evaluate(() => {
      const contentElement = document.querySelector('[data-testid="tweetText"]');
      const content = contentElement?.innerText || "Unavailable";

      const userElement = document.querySelector('div.r-1wbh5a2.r-dnmrzs > span');
      const username = userElement?.textContent || "Unavailable";

      const followersEl = Array.from(document.querySelectorAll("a"))
        .find(a => a.href.includes("/followers") && a.querySelector("span span"));
      const followersText = followersEl?.innerText || "Unavailable";

      return { content, username, followersText };
    });

    await browser.close();

    return res.json({
      content: data.content,
      username: data.username,
      followers: formatFollowers(data.followersText),
      url: tweetUrl,
    });
  } catch (err) {
    await browser.close();
    return res.status(500).json({ error: "Scraping failed", details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
