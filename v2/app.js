const express = require('express');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

app.get('/scrape', async (req, res) => {
  const tweetURL = req.query.url;
  if (!tweetURL) return res.status(400).json({ error: 'URL is required' });

  const m = tweetURL.match(/(?:twitter|x)\.com\/([^\/]+)\/status\/(\d+)/i);
  if (!m) return res.status(400).json({ error: 'Invalid Twitter/X URL' });
  const [, username, statusId] = m;

  const nitterURL = `https://nitter.net/${username}/status/${statusId}`;
  try {
    const resp = await fetch(nitterURL, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await resp.text();
    const $ = cheerio.load(html);

    const content = $('.tweet-content').first().text().trim() || 'Unavailable';
    const followers = $('li a[href$="/followers"] .profile-statnum')
      .first()
      .text()
      .trim() || 'Unavailable';

    res.json({ url: tweetURL, username, content, followers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
