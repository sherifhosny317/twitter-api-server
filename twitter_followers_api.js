const express = require('express');
const fetch = require('node-fetch');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/followers', async (req, res) => {
  const username = req.query.username;
  if (!username) return res.status(400).json({ error: 'Username is required' });
  try {
    const url = `https://mobile.twitter.com/${username}`;
    const resp = await fetch(url);
    const html = await resp.text();
    const $ = cheerio.load(html);
    const link = $('a[href$="/followers"]').first();
    const followers = link.text().trim() || 'Unavailable';
    res.json({ username, followers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
