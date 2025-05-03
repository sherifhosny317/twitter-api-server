const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

app.post('/scrape', async (req, res) => {
  const tweetURL = req.body.url;
  if (
    !tweetURL ||
    (!tweetURL.includes('twitter.com') && !tweetURL.includes('x.com'))
  ) {
    return res.status(400).json({ error: 'Invalid Twitter/X URL' });
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath:
      'C:\\\\Users\\\\Sherif\\\\AppData\\\\Local\\\\Chromium\\\\Application\\\\chrome.exe'
  });

  try {
    const page = await browser.newPage();

    // 1) Extract tweet content
    await page.goto(tweetURL, { waitUntil: 'networkidle2' });
    await page.waitForSelector('[data-testid="tweetText"]', { timeout: 10000 });
    const content = await page.$eval(
      '[data-testid="tweetText"]',
      el => el.innerText.trim()
    );

    // 2) Extract username from URL and then followers from profile
    const match = tweetURL.match(/(?:twitter|x)\\.com\\/([^\\/]+)\\//i);
    const username = match ? match[1] : '';
    const profileURL = `https://twitter.com/${username}`;

    await page.goto(profileURL, { waitUntil: 'networkidle2' });
    await page.waitForSelector('a[href$="/followers"] span span', {
      timeout: 10000
    });
    const followers = await page.$eval(
      'a[href$="/followers"] span span',
      el => el.innerText.trim()
    );

    res.json({ url: tweetURL, content, username, followers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await browser.close();
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
