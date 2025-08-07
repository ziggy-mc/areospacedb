// routes/botGuilds.js
const express = require('express');
const router = express.Router();

module.exports = (client) => {
	router.get('/bot-guilds', async (req, res) => {
		try {
			const guilds = client.guilds.cache.map((guild) => ({
				id: guild.id,
				name: guild.name,
				icon: guild.icon,
			}));
			res.json(guilds);
		} catch (error) {
			console.error('Error fetching bot guilds:', error);
			res.status(500).json({ error: 'Failed to fetch bot guilds' });
		}
	});
	return router;
};
