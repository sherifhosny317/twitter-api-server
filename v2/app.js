const express = require('express');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const nitterInstances = [
  'https://nitter.net',
  'https://nitter.privacydev.net',
  'https://nitter.13ad.de'
];

app.use(express.static(path.join(__dirname, 'public')));

async function fetchWorkingInstance(urlPath) {
  for (const base of nitterInstances) {
    const fullUrl = `${base}${urlPath}`;
    try {
      const response = await fetch(fullUrl, { timeout: 10000 });
      if (response.ok) return await response.text();
    } catch (e) {}
  }
  throw new Error('All Nitter instances failed');
}

app.get('/scrape', async (req, res) => {
  const url = req.query.url || '';
  const match = url.match(/x\.com\/(.*?)\/status\/(\d+)/);
  if (!match) return res.status(400).json({ error: 'Invalid tweet URL' });

  const username = match[1];
  const tweetId = match[2];

  try {
    const tweetHtml = await fetchWorkingInstance(`/${username}/status/${tweetId}`);
    const $ = cheerio.load(tweetHtml);
    const content = $('div.main-tweet .tweet-content p').text().trim() || 'Unavailable';

    const profileHtml = await fetchWorkingInstance(`/${username}`);
    const _$ = cheerio.load(profileHtml);
    const followersText = _$('a[href$="/followers"]').first().text().trim();
    const followers = parseInt(followersText.replace(/[^0-9]/g, '')) || 0;

    res.json({
      template: `*Social Media:* X (formerly Twitter)

*Link:* https://x.com/${username}/status/${tweetId}

${content}

*User Name:* @${username}

*Number of followers:* ${followers}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
