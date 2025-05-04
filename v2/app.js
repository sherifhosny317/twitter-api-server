require('dotenv').config()
const express = require('express')
const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args))
const cheerio = require('cheerio')

const app = express()

app.get('/scrape', async (req, res) => {
  const tweetUrl = req.query.url
  if (!tweetUrl) {
    return res.json({ error: 'Missing url parameter' })
  }

  try {
    const m = tweetUrl.match(/(?:twitter|x)\.com\/([^\/]+)\/status\/(\d+)/i)
    if (!m) throw new Error('Invalid URL')
    const username = m[1]
    const tweetId = m[2]
    const nitter = 'https://nitter.net'

    const tweetResp = await fetch(`${nitter}/${username}/status/${tweetId}`)
    if (!tweetResp.ok) throw new Error(`Failed to fetch tweet: HTTP ${tweetResp.status}`)
    const tweetHtml = await tweetResp.text()
    const $ = cheerio.load(tweetHtml)
    const content = $('.tweet-content p').first().text().trim() || 'Unavailable'

    const profileResp = await fetch(`${nitter}/${username}`)
    if (!profileResp.ok) throw new Error(`Failed to fetch profile: HTTP ${profileResp.status}`)
    const profileHtml = await profileResp.text()
    const $p = cheerio.load(profileHtml)
    const followers = $p('div.profile-statnums a[href$="/followers"]').text().trim() || 'Unavailable'

    res.json({ url: tweetUrl, username, content, followers })
  } catch (err) {
    res.json({ error: err.message })
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
