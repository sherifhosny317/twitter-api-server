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
  const twiiitUrl = `https://twiiit.com/${username}/status/${tweetId}`;

  try {
    const response = await fetch(twiiitUrl, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    const html = await response.text();
    const $ = cheerio.load(html);

    const content = $('.main-tweet .tweet-content').text().trim() || 'Unavailable';
    const followersText = $('a[href$="/followers"]').text().trim();
    const followers = parseInt(followersText.replace(/\D/g, '')) || 'Unavailable';

    const finalTemplate = `*Social Media:* X (formerly Twitter)

*Link:* https://x.com/${username}/status/${tweetId}

${content}

*User Name:* @${username}

*Number of followers:* ${followers}`;

    res.json({ template: finalTemplate });

  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tweet via twiiit.com' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
