const express = require('express')
const fetch = require('node-fetch')
const cheerio = require('cheerio')
const path = require('path')
const app = express()
const port = process.env.PORT || 3000

const nitterInstances = [
  'https://nitter.net',
  'https://nitter.snopyta.org',
  'https://nitter.1d4.us',
  'https://nitter.13ad.de'
]

async function tryFetch(originalUrl) {
  for (const inst of nitterInstances) {
    const url = originalUrl
      .replace(/https?:\/\/[^/]+/, inst)
      .replace(/#.*$/, '')
    try {
      const res = await fetch(url, { timeout: 10000 })
      if (res.ok) return res
    } catch (err) {}
  }
  throw new Error('All nitter instances failed')
}

app.use(express.static(path.join(__dirname, 'public')))

app.get('/scrape', async (req, res) => {
  const tweetUrl = req.query.url || ''
  const m = tweetUrl.match(/(?:twitter|x)\.com\/([^\/]+)\/status\/(\d+)/i)
  const username = m ? m[1] : 'Unknown'
  let content = 'Unavailable'
  let followers = 'Unavailable'
  try {
    const tweetRes = await tryFetch(tweetUrl)
    const html = await tweetRes.text()
    const $ = cheerio.load(html)
    content = $('div.main-tweet div.tweet-content p').text().trim() ||
              $('div.tweet-content p').text().trim() ||
              'Unavailable'
    const profRes = await tryFetch(`https://nitter.net/${username}`)
    const profHtml = await profRes.text()
    const _$ = cheerio.load(profHtml)
    followers = _$('div.profile-statlist a[href$="/followers"]').text().trim() ||
                'Unavailable'
    res.json({ url: tweetUrl, username, content, followers })
  } catch (err) {
    res.json({ url: tweetUrl, username, content, followers, error: err.message })
  }
})

app.listen(port)
