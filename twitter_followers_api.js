const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = 3000;

app.get('/followers', async (req, res) => {
  const username = req.query.username;
  if (!username) return res.status(400).json({ error: 'Username is required' });

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    const url = `https://x.com/${username}`;
    await page.goto(url, { waitUntil: 'networkidle2' });
    await page.waitForSelector('a[href$="/followers"] span', { timeout: 8000 });

    const followers = await page.$eval('a[href$="/followers"] span', el => el.innerText);
    await browser.close();

    return res.json({ username, followers });
  } catch (err) {
    await browser.close();
    return res.status(500).json({ error: 'Failed to fetch followers', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Puppeteer API running on http://localhost:${PORT}`);
});
