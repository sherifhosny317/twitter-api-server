const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

app.get('/scrape', async (req, res) => {
  const tweetUrl = req.query.url;
  if (!tweetUrl) return res.status(400).json({ error: 'Missing URL' });

  try {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto(tweetUrl, { waitUntil: 'networkidle2', timeout: 60000 });

    await page.waitForSelector('article');

    const data = await page.evaluate(() => {
      const article = document.querySelector('article');
      const usernameSpan = article.querySelector('a[role="link"][href^="/"] > div > div > span');
      const tweetContent = article.querySelector('div[data-testid="tweetText"]');
      const username = usernameSpan ? usernameSpan.textContent : 'Unavailable';
      const content = tweetContent ? tweetContent.innerText : 'Unavailable';
      return { username, content };
    });

    await browser.close();

    res.json({
      url: tweetUrl,
      username: data.username,
      content: data.content,
      followers: 'Unavailable'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
