require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const querystring = require('querystring');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

// Discord OAuth2 redirect
app.get('/api/auth/discord', (req, res) => {
  const params = querystring.stringify({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'identify guilds',
    prompt: 'consent'
  });
  res.redirect(`https://discord.com/api/oauth2/authorize?${params}`);
});

// Discord OAuth2 callback
app.get('/api/auth/discord/callback', async (req, res) => {
  const code = req.query.code;
  const data = querystring.stringify({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    scope: 'identify guilds'
  });

  try {
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      body: data,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    const tokenJson = await tokenResponse.json();

    const [userRes, userGuildsRes, botGuildsRes] = await Promise.all([
      fetch('https://discord.com/api/users/@me', {
        headers: { Authorization: `Bearer ${tokenJson.access_token}` },
      }),
      fetch('https://discord.com/api/users/@me/guilds', {
        headers: { Authorization: `Bearer ${tokenJson.access_token}` },
      }),
      fetch('https://discord.com/api/users/@me/guilds', {
        headers: { Authorization: `Bot ${BOT_TOKEN}` },
      })
    ]);

    const user = await userRes.json();
    const userGuilds = await userGuildsRes.json();
    const botGuilds = await botGuildsRes.json();

    const mutualGuilds = userGuilds
      .filter(guild => (guild.permissions & 0x20) === 0x20) // MANAGE_GUILD permission
      .map(guild => {
        return {
          id: guild.id,
          name: guild.name,
          icon: guild.icon,
          inBot: botGuilds.some(botGuild => botGuild.id === guild.id)
        };
      });

    res.json({ user, guilds: mutualGuilds });
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).send('Authentication failed');
  }
});

app.listen(3001, () => console.log('OAuth server running on http://localhost:3001'));
