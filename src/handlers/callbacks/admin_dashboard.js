const { Markup } = require('telegraf');
const btn = require('../../events/style');
const { Emoji, emojiMap, buildEmojiHtml } = require('../../events/emojiMap');

const sendAdminDashboard = async (ctx, logger, triggerType) => {
	try {
		if (logger) logger.callback('admin:dashboard', triggerType, ctx.from && (ctx.from.username || ctx.from.first_name));
	} catch (_) {}
	
	try { await ctx.sendChatAction('typing'); } catch (_) {}
	
	const adminDashboard = buildEmojiHtml(`${Emoji.lock} Admin Dashboard\n\n${Emoji.hilo} Selamat datang Admin,\n\nKlik menu di bawah untuk mengelola bot.`);
	
	const keyboard = Markup.inlineKeyboard([
		[{ text: 'Stats', icon_custom_emoji_id: emojiMap.statsup, callback_data: 'admin:stats', style: btn.green }],
		[{ text: 'Add', icon_custom_emoji_id: emojiMap.add || emojiMap.sb, callback_data: 'admin:add:menu', style: btn.blue }, { text: 'Set', icon_custom_emoji_id: emojiMap.gear || emojiMap.lock, callback_data: 'admin:set:menu', style: btn.blue }],
		[{ text: 'Home', icon_custom_emoji_id: emojiMap.homes, callback_data: 'home', style: btn.green }]
	]);
	
	try {
		if (ctx.callbackQuery) {
			return await ctx.editMessageText(adminDashboard, {
				...keyboard,
				parse_mode: 'HTML'
			});
		}
	} catch (_) {}

	await ctx.reply(adminDashboard, {
		...keyboard,
		parse_mode: 'HTML'
	});
};

module.exports = (bot, logger) => {
	bot.hears([/dashboard/i, '📊 Dashboard', 'Dashboard'], async (ctx) => {
		await sendAdminDashboard(ctx, logger, 'hears');
	});

	bot.action(/admin:dashboard.*/, async (ctx) => {
		try { await ctx.answerCbQuery(); } catch (_) {}
		await sendAdminDashboard(ctx, logger, 'action');
	});

	bot.action('admin_dashboard', async (ctx) => {
		try { await ctx.answerCbQuery(); } catch (_) {}
		await sendAdminDashboard(ctx, logger, 'action');
	});

	bot.hears([/kembali/i, '⬅️ Kembali', 'Kembali'], async (ctx) => {
		await sendAdminDashboard(ctx, logger, 'hears_back');
	});
};