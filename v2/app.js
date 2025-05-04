const express = require('express');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/scrape', async (req, res) => {
  const url = req.query.url;
  const match = url.match(/x\.com\/([^\/]+)\/status\/(\d+)/);
  if (!match) return res.status(400).json({ error: 'Invalid tweet URL' });

  const username = match[1];
  const tweetId = match[2];
  const profileURL = `https://twiiit.com/${username}`;

  try {
    const response = await fetch(profileURL, {
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const html = await response.text();
    const $ = cheerio.load(html);

    const finalURL = response.url;
    const followersText = $('a[href$="/followers"]').first().text().trim();
    const followers = parseInt(followersText.replace(/\D/g, '')) || 'Unavailable';

    const template = `*Social Media:* X (formerly Twitter)

*Link:* https://x.com/${username}/status/${tweetId}

*User Name:* @${username}

*Number of followers:* ${followers}`;

    res.json({ template });

  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch data from Twiiit' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
