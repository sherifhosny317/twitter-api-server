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

  try {
    const mobileUrl = `https://mobile.twitter.com/${username}/status/${statusId}`;
    const html = await (await fetch(mobileUrl)).text();
    const $ = cheerio.load(html);

    // 1) استخراج النص من أول div مع lang داخل article
    const tweetText = $('article div[lang]').first().text().trim() || 'Unavailable';

    // 2) استخراج عدد المتابعين من آخر رابط ينتهي ب /followers
    const followerAnchor = $('a[href$="/followers"]').last();
    const followersSpan = followerAnchor.find('span').last();
    let followers = followersSpan.text().trim() || 'Unavailable';
    // إزالة الكلمة "Followers" لو موجودة
    followers = followers.replace(/Followers?/, '').trim();

    res.json({ url: mobileUrl, tweetText, username, followers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
