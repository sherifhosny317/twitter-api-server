const express = require('express');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const nitterInstances = [
  'https://nitter.net',
  'https://nitter.snopyta.org',
  'https://nitter.1d4.us',
  'https://nitter.pussthecat.org'
];

app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

async function tryFetch(url) {
  let lastErr;
  for (const base of nitterInstances) {
    try {
      const resp = await fetch(url.replace(/^https?:\/\/[^/]+/, base), { timeout: 10000 });
      if (resp.ok) return await resp.text();
      lastErr = new Error(`HTTP ${resp.status}`);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

app.get('/scrape', async (req, res) => {
  const tweetURL = req.query.url;
  if (!tweetURL) return res.json({ error: 'Missing url query parameter' });
  const usernameMatch = tweetURL.match(/x\.com\/([^\/]+)\//i);
  const username = usernameMatch ? usernameMatch[1] : 'Unavailable';

  try {
    const tweetHTML = await tryFetch(tweetURL);
    const $ = cheerio.load(tweetHTML);
    const content = $('div.tweet-content p').text().trim() || 'Unavailable';

    let followers = 'Unavailable';
    try {
      const profileHTML = await tryFetch(`https://x.com/${username}`);
      const $$ = cheerio.load(profileHTML);
      followers = $$('a[href$="/followers"] .profile-stat-num').first().text().trim() || 'Unavailable';
    } catch {}

    res.json({ url: tweetURL, username, content, followers });
  } catch (err) {
    res.json({ url: tweetURL, username, content: 'Unavailable', followers: 'Unavailable', error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
