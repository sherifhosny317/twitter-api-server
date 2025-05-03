// v2/app.js
const express = require('express');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static assets
app.use(express.static(path.join(__dirname, 'public')));

app.get('/scrape', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  const match = url.match(/(?:twitter|x)\.com\/([^\/]+)\/status\/(\d+)/i);
  if (!match) return res.status(400).json({ error: 'Invalid Twitter/X status URL' });
  const [, username, statusId] = match;

  try {
    const mobileUrl = `https://mobile.twitter.com/${username}/status/${statusId}`;
    const html = await (await fetch(mobileUrl)).text();
    const $ = cheerio.load(html);

    // 1) Tweet content via data-testid="tweetText"
    const tweetText = $('div[data-testid="tweetText"]')
      .map((i, el) => $(el).text())
      .get()
      .join(' ')
      .trim() || 'Unavailable';

    // 2) Followers: anchor ending with /followers, extract trailing number
    const followersText = $('a[href$="/followers"]').text().trim();
    const m = followersText.match(/([\d,\.]+)\s*Followers?$/i);
    const followers = m ? m[1] : 'Unavailable';

    res.json({ url: mobileUrl, tweetText, username, followers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
