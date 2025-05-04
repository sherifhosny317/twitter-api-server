const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/scrape', async (req, res) => {
  const tweetUrl = req.query.url;
  const match = tweetUrl.match(/x\.com\/([^\/]+)\/status\/(\d+)/);
  if (!match) return res.status(400).json({ error: 'Invalid tweet URL' });

  const username = match[1];
  const tweetId = match[2];
  const profileUrl = `https://nitter.net/${username}`;
  const tweetPageUrl = `https://nitter.net/${username}/status/${tweetId}`;

  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

    const followers = await page.$eval('a[href$="/followers"]', el => el.textContent.trim().replace(/\D/g, ''));

    await page.goto(tweetPageUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

    const content = await page.$eval('.tweet-content', el => el.innerText.trim());

    await browser.close();

    const template = `*Social Media:* X (formerly Twitter)

*Link:* ${tweetUrl}

${content}

*User Name:* @${username}

*Number of followers:* ${followers}`;

    res.json({ template });
  } catch (error) {
    res.json({ error: 'Puppeteer scraping failed. Try another username or instance.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
