const express = require('express');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 1) Serve static UI from public/
app.use(express.static(path.join(__dirname, 'public')));

// 2) Root route -> index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/scrape', async (req, res) => {
  const tweetURL = req.query.url;
  if (!tweetURL) return res.json({ error: 'Missing url query parameter' });

  try {
    // fetch the tweet page via Nitter
    const nitterURL = tweetURL.replace(/^(?:https?:\/\/)(?:www\.)?x\.com/, 'https://nitter.net');
    const resp = await fetch(nitterURL);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const html = await resp.text();
    const $ = cheerio.load(html);

    // extract content
    const content = $('div.tweet-content').find('p').text().trim() || 'Unavailable';

    // extract username & followers
    const usernameMatch = tweetURL.match(/x\.com\/([^\/]+)\//i);
    const username = usernameMatch ? usernameMatch[1] : 'Unavailable';
    const profileURL = `https://nitter.net/${username}`;
    const profileResp = await fetch(profileURL);
    let followers = 'Unavailable';
    if (profileResp.ok) {
      const profileHTML = await profileResp.text();
      const $$ = cheerio.load(profileHTML);
      const count = $$('.profile-stat[href$="/followers"] .profile-stat-num').text().trim();
      if (count) followers = count;
    }

    res.json({ url: tweetURL, username, content, followers });
  } catch (err) {
    res.json({ url: tweetURL, username: 'Unavailable', content: 'Unavailable', followers: 'Unavailable', error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
