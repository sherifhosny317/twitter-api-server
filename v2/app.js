const express = require('express');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/scrape', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  const match = url.match(/(?:twitter|x)\.com\/([^\/]+)\/status\/(\d+)/i);
  if (!match) return res.status(400).json({ error: 'Invalid URL' });
  const [, username, statusId] = match;

  try {
    const resp = await fetch(
      `https://mobile.twitter.com/${username}/status/${statusId}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    const html = await resp.text();
    const $ = cheerio.load(html);

    const tweetText = $('div[data-testid="tweetText"], div.tweet-text, div.dir-ltr')
      .first().text().trim() || 'Unavailable';
    const followers = $('a[href$="/followers"] span').first().text().trim() || 'Unavailable';

    res.json({ url, username, tweetText, followers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
