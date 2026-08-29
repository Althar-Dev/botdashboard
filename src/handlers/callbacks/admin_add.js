const { Markup } = require('telegraf');
const btn = require('../../events/style');

module.exports = (bot, logger) => {
	bot.hears([/add/i, '➕ Add', 'Add'], async (ctx) => {
		try {
			if (logger) logger.callback('admin:add', 'hears', ctx.from && (ctx.from.username || ctx.from.first_name));
		} catch (_) {}
		
		try { await ctx.sendChatAction('typing'); } catch (_) {}
		
		const text = `Addons\n\nHalo Admin, ingin menambahkan sesuatu?\nSilakan pilih menu di bawah.\n\nPenjelasan singkat:\n- Product: Tambah produk baru.\n- Variant: Tambah varian ke produk yang dipilih.\n- Stock: Tambah stock ke varian yang dipilih.\n- Admin: Tambah ID admin ke konfigurasi.\n- Emoji: Tambah mapping emoji baru.`;
		const keyboard = Markup.inlineKeyboard([
			[{text: 'Product', callback_data: 'admin:add:category', style: btn.blue}, {text: 'Variant', callback_data: 'admin:add:product', style: btn.blue}],
			[{text: 'Stock', callback_data: 'admin:add:stock', style: btn.blue}],
			[{text: 'Admin', callback_data: 'admin:add:admin', style: btn.blue}, {text: 'Emoji', callback_data: 'admin:add:emoji', style: btn.blue}],
			[{text: 'Kembali', callback_data: 'admin:dashboard:back', style: btn.red}]
		]);
		
		await ctx.reply(text, keyboard);
	});
};
