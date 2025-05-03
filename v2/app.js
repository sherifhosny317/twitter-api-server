const express = require('express');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/scrape', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  const match = url.match(/(?:twitter|x)\.com\/([^\/]+)\/status\/(\d+)/i);
  if (!match) return res.status(400).json({ error: 'Invalid Twitter/X status URL' });

  const [, username, statusId] = match;
  const tweetUrl = `https://mobile.twitter.com/${username}/status/${statusId}`;

  try {
    const response = await fetch(tweetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract tweet text more reliably
    let tweetText = $('div.tweet-text').text().trim();
    if (!tweetText) {
      tweetText = $('div[class*="dir-ltr"]').first().text().trim();
    }

    // Extract followers
    let followers = 'Unavailable';
    $('a[href$="/followers"]').each((i, el) => {
      const text = $(el).text().replace(/,/g, '');
      const match = text.match(/([\d\.]+)([MK]?)\s+Followers?/i);
      if (match) {
        let [ , num, suffix ] = match;
        num = parseFloat(num);
        if (suffix === 'M') num *= 1_000_000;
        else if (suffix === 'K') num *= 1_000;
        followers = Math.round(num).toLocaleString();
      }
    });

    res.json({ url: tweetUrl, tweetText: tweetText || 'Unavailable', username, followers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
