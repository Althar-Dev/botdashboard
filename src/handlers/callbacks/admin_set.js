const { Markup } = require('telegraf');
const { emojiMap } = require('../../events/emojiMap');
const btn = require('../../events/style');

const sendAdminSetMenu = async (ctx, logger, triggerType) => {
	try {
		if (logger) logger.callback('admin:set', triggerType, ctx.from && (ctx.from.username || ctx.from.first_name));
	} catch (_) {}
	
	try { await ctx.sendChatAction('typing'); } catch (_) {}
	
	const keyboard = Markup.inlineKeyboard([
		[{ text: 'Set Product Icon', callback_data: 'set:icon:category', style: btn.blue }, { text: 'Set Variant Icon', callback_data: 'set:icon:product', style: btn.blue }],
		[{ text: 'Set Shop Name', callback_data: 'set:config:bot.shopName', style: btn.blue }, { text: 'Set Channel', callback_data: 'set:config:bot.channel', style: btn.blue }],
		[{ text: 'Set Btn Cols', callback_data: 'set:config:bot.btnCtr', style: btn.blue }, { text: 'Set Product Btn Cols', callback_data: 'set:config:bot.btnPrd', style: btn.blue }],
		[{ text: 'Set SValePay ID', callback_data: 'set:config:svalepay.business_id', style: btn.blue }, { text: 'Set SValePay Key', callback_data: 'set:config:svalepay.secret_key', style: btn.blue }],
		[{ text: 'Kembali', icon_custom_emoji_id: emojiMap.backs, callback_data: 'admin_dashboard', style: btn.red }]
	]);
	
	const text = 'Pilih pengaturan yang ingin diubah:';
	try {
		if (ctx.callbackQuery) {
			return await ctx.editMessageText(text, keyboard);
		}
	} catch (_) {}

	await ctx.reply(text, keyboard);
};

module.exports = (bot, logger) => {
	bot.hears([/set/i, '⚙️ Set', 'Set'], async (ctx) => {
		await sendAdminSetMenu(ctx, logger, 'hears');
	});

	bot.action('admin:set:menu', async (ctx) => {
		try { await ctx.answerCbQuery(); } catch (_) {}
		await sendAdminSetMenu(ctx, logger, 'action');
	});
};
