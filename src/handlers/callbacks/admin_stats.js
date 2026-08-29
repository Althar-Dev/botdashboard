const path = require('path');
const fs = require('fs');
const { Markup } = require('telegraf');
const btn = require('../../events/style');
const { Emoji, emojiMap, buildEmojiHtml } = require('../../events/emojiMap');

const statsDbPath = path.join(__dirname, '..', '..', 'database', 'stats.json');

const readJsonFile = (filePath, defaultValue) => {
	try {
		if (!fs.existsSync(filePath)) return defaultValue;
		const raw = fs.readFileSync(filePath, 'utf8').trim();
		return raw ? JSON.parse(raw) : defaultValue;
	} catch (error) {
		console.error(`Error reading JSON file ${filePath}:`, error);
		return defaultValue;
	}
};

const normalizeStats = (stats) => ({
	totalUser: Number(stats && stats.totalUser ? stats.totalUser : 0),
	productsSold: Number(stats && stats.productsSold ? stats.productsSold : 0),
	uptime: stats && stats.uptime ? stats.uptime : '99.9%'
});

const getStats = () => normalizeStats(readJsonFile(statsDbPath, {
	totalUser: 0,
	productsSold: 0,
	uptime: '99.9%'
}));

const sendAdminStats = async (ctx, logger, triggerType) => {
	try {
		if (logger) logger.callback('admin:stats', triggerType, ctx.from && (ctx.from.username || ctx.from.first_name));
	} catch (_) {}
	
	try { await ctx.sendChatAction('typing'); } catch (_) {}
	
	const stats = getStats();
	const statsText = buildEmojiHtml(`${Emoji.bot} <strong>Bot Statistics</strong> ${Emoji.statsup}\n\n<blockquote>${Emoji.users} Total User : ${Number(stats.totalUser || 0).toLocaleString('id-ID')}\n${Emoji.cart2} Products Sold : ${Number(stats.productsSold || 0).toLocaleString('id-ID')}\n${Emoji.nonstop} Uptime : ${stats.uptime}\n\nUpdated : ${new Date().toLocaleString('id-ID')}</blockquote>`);
	
	const keyboard = Markup.inlineKeyboard([
		[{ text: 'Back', icon_custom_emoji_id: emojiMap.backs, callback_data: 'admin_dashboard', style: btn.red }, { text: 'Menu', icon_custom_emoji_id: emojiMap.homes, callback_data: 'home', style: btn.green }]
	]);
	
	try {
		if (ctx.callbackQuery) {
			return await ctx.editMessageText(statsText, {
				...keyboard,
				parse_mode: 'HTML'
			});
		}
	} catch (_) {}

	await ctx.reply(statsText, {
		...keyboard,
		parse_mode: 'HTML'
	});
};

module.exports = (bot, logger) => {
	bot.hears([/stats/i, '📈 Stats', 'Stats'], async (ctx) => {
		await sendAdminStats(ctx, logger, 'hears');
	});

	bot.action('admin:stats', async (ctx) => {
		try { await ctx.answerCbQuery(); } catch (_) {}
		await sendAdminStats(ctx, logger, 'action');
	});
};
