const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/scrape', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.json({ error: 'Missing url parameter' });

  let browser;
  try {
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    const content = await page
      .$$eval('span[data-testid="tweetText"]', els =>
        els.map(el => el.innerText).join('\n')
      )
      .then(txt => txt || 'Unavailable')
      .catch(() => 'Unavailable');

    const usernameMatch = url.match(/(?:twitter|x)\.com\/([^\/]+)\//i);
    const username = usernameMatch ? usernameMatch[1] : 'Unavailable';

    await page.goto(`https://x.com/${username}`, { waitUntil: 'networkidle2' });

    const followers = await page
      .$eval(`a[href="/${username}/followers"] span`, el => el.innerText)
      .catch(() => 'Unavailable');

    res.json({ url, username, content, followers });
  } catch (err) {
    res.json({ error: err.message });
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});