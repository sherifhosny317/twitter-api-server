const express = require('express');
const puppeteer = require('puppeteer-core');
const chromium = require('chrome-aws-lambda');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/followers', async (req, res) => {
  const username = req.query.username;
  if (!username) return res.status(400).json({ error: 'Username is required' });

  let browser;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    const url = `https://x.com/${username}`;
    await page.goto(url, { waitUntil: 'networkidle2' });
    await page.waitForSelector('a[href$="/followers"] span', { timeout: 8000 });

    const followers = await page.$eval('a[href$="/followers"] span', el => el.innerText);
    res.json({ username, followers });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch followers', details: err.message });
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(PORT, () => {
  console.log(`✅ Puppeteer Core API running on port ${PORT}`);
});
