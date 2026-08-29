const { Markup } = require('telegraf');
const path = require('path');
const fs = require('fs');
const btn = require('../../events/style');
const { Emoji, emojiMap, buildEmojiEntities } = require('../../events/emojiMap');

const configPath = path.join(__dirname, '..', '..', 'database', 'config.json');
let config = {};
try { config = require(configPath); } catch (_) { config = {}; }

const isAdmin = (ctx) => {
	const adminList = (config && config.bot && Array.isArray(config.bot.adminId)) ? config.bot.adminId : [];
	const id = ctx.from && ctx.from.id;
	if (!id) return false;
	return adminList.map(String).includes(String(id));
};

const buildMenu = () => {
	return Markup.inlineKeyboard([
		[{text: 'Product', callback_data: 'admin:add:category', style: btn.blue}, {text: 'Variant', callback_data: 'admin:add:product', style: btn.blue}, {text: 'Stock', callback_data: 'admin:add:stock', style: btn.blue}],
		[{text: 'Admin', callback_data: 'admin:add:admin', style: btn.blue}, {text: 'Emoji', callback_data: 'admin:add:emoji', style: btn.blue}],
		[{text: 'Home', callback_data: 'home', style: btn.green}]
	]);
};

const sendAddMenu = async (ctx) => {
	const text = `Addons\n\nHalo Admin, ingin menambahkan sesuatu?\nSilakan pilih menu di bawah.\n\nPenjelasan singkat:\n- Product: Tambah produk baru.\n- Variant: Tambah varian ke produk yang dipilih.\n- Stock: Tambah stock ke varian yang dipilih.\n- Admin: Tambah ID admin ke konfigurasi.\n- Emoji: Tambah mapping emoji baru ke emojiMap.json.`;
	const keyboard = buildMenu();
	try { await ctx.sendChatAction('typing'); } catch (_) {}
	try {
		return await ctx.editMessageText(text, keyboard);
	} catch (e) {
		return await ctx.reply(text, keyboard);
	}
};

const sessions = {};
const productPath = path.join(__dirname, '..', '..', 'database', 'product.json');
const userPath = path.join(__dirname, '..', '..', 'database', 'user.json');
const emojiMapPath = path.join(__dirname, '..', '..', 'database', 'emojiMap.json');
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

const writeJsonFile = (filePath, value) => {
	try {
		const dir = path.dirname(filePath);
		if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
		fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8');
	} catch (error) {
		console.error(`Error writing JSON file ${filePath}:`, error);
	}
};

const listProductsKeyboard = (callbackPrefix = 'admin:add:product:category') => {
	const products = readJsonFile(productPath, []);
	if (!Array.isArray(products) || products.length === 0) {
		return null;
	}
	const rows = products.map(prod => [{text: prod.name || prod.id, callback_data: `${callbackPrefix}:${prod.id}`, style: btn.blue}]);
	rows.push([{text: 'Back', icon_custom_emoji_id: emojiMap.backs, callback_data: 'admin:add:menu', style: btn.red}, {text: 'Menu', icon_custom_emoji_id: emojiMap.homes, callback_data: 'home', style: btn.green}]);
	return Markup.inlineKeyboard(rows);
};

const listVariantsKeyboard = (productId) => {
	const products = readJsonFile(productPath, []);
	const product = products.find(p => String(p.id) === String(productId));
	if (!product || !Array.isArray(product.items) || product.items.length === 0) {
		return null;
	}
	const rows = product.items.map(item => [{text: item.name || item.id, callback_data: `admin:add:stock:product:${productId}:${item.id}`, style: btn.blue}]);
	rows.push([{text: 'Back', icon_custom_emoji_id: emojiMap.backs, callback_data: 'admin:add:stock', style: btn.red}, {text: 'Menu', icon_custom_emoji_id: emojiMap.homes, callback_data: 'home', style: btn.green}]);
	return Markup.inlineKeyboard(rows);
};

const clearSession = (chatId) => { if (sessions && sessions[chatId]) delete sessions[chatId]; };

module.exports = (bot, logger) => {
	bot.command('add', async (ctx) => {
		try { if (logger) logger.command && logger.command('add', 'chat', ctx.from && (ctx.from.username || ctx.from.first_name)); } catch (_) {}
		try { await ctx.sendChatAction('typing'); } catch (_) {}

		if (!isAdmin(ctx)) {
			const msgText = `${Emoji.denied} Akses ditolak. Perintah ini hanya untuk admin.`;
			const entities = buildEmojiEntities(msgText);
			try { await ctx.sendChatAction('typing'); } catch (_) {}
			return ctx.reply(msgText, { entities });
		}

		const text = `Addons\n\nHalo Admin, ingin menambahkan sesuatu?\nSilakan pilih menu di bawah.\n\nPenjelasan singkat:\n- Product: Tambah produk baru.\n- Variant: Tambah varian ke produk yang dipilih.\n- Stock: Tambah stock ke varian yang dipilih.\n- Admin: Tambah ID admin ke konfigurasi.`;
		const keyboard = buildMenu();
		try {
			await ctx.reply(text, keyboard);
		} catch (err) {
			console.error('Failed to send /add menu', err);
		}
	});

	bot.action('admin:add:category', async (ctx) => {
		try { if (logger) logger.callback && logger.callback('admin:add:category', 'callback', ctx.from && (ctx.from.username || ctx.from.first_name)); } catch(_) {}
		try { await ctx.sendChatAction('typing'); } catch(_) {}
		if (!isAdmin(ctx)) return ctx.answerCbQuery('Hanya admin.');

		const text = `Menambahkan Product\n\nSilakan kirim data produk dalam format: <id>|<nama>|<icon>\nContoh:\ncc|CapCut|capcut`;
		const keyboard = Markup.inlineKeyboard([
			[{text: 'Back', icon_custom_emoji_id: emojiMap.backs, callback_data: 'admin:add:menu', style: btn.red}, {text: 'Menu', icon_custom_emoji_id: emojiMap.homes, callback_data: 'home', style: btn.green}]
		]);
		const chatId = ctx.from && ctx.from.id;
		if (chatId) {
			sessions[chatId] = { mode: 'add_category' };
			try {
				const msg = ctx.update && ctx.update.callback_query && ctx.update.callback_query.message;
				if (msg && msg.message_id) sessions[chatId].promptMessageId = msg.message_id;
			} catch (_) {}
		}
		try { await ctx.editMessageText(text, keyboard); } catch (e) { await ctx.reply(text, keyboard); }
	});

	bot.action('admin:add:product', async (ctx) => {
		try { if (logger) logger.callback && logger.callback('admin:add:product', 'callback', ctx.from && (ctx.from.username || ctx.from.first_name)); } catch(_) {}
		try { await ctx.sendChatAction('typing'); } catch(_) {}
		if (!isAdmin(ctx)) return ctx.answerCbQuery('Hanya admin.');

		const kb = listProductsKeyboard();
		if (!kb) {
			return ctx.reply('Belum ada produk. Tambahkan product terlebih dahulu.');
		}
		try { await ctx.editMessageText('Pilih produk untuk menambahkan varian:', kb); } catch (e) { await ctx.reply('Pilih produk untuk menambahkan varian:', kb); }
	});

	bot.action('admin:add:stock', async (ctx) => {
		try { if (logger) logger.callback && logger.callback('admin:add:stock', 'callback', ctx.from && (ctx.from.username || ctx.from.first_name)); } catch(_) {}
		try { await ctx.sendChatAction('typing'); } catch(_) {}
		if (!isAdmin(ctx)) return ctx.answerCbQuery('Hanya admin.');

		const kb = listProductsKeyboard('admin:add:stock:category');
		if (!kb) {
			return ctx.reply('Belum ada produk. Tambahkan product terlebih dahulu.');
		}
		try { await ctx.editMessageText('Pilih produk untuk menambahkan stock:', kb); } catch (e) { await ctx.reply('Pilih produk untuk menambahkan stock:', kb); }
	});

	bot.action('admin:add:admin', async (ctx) => {
		try { if (logger) logger.callback && logger.callback('admin:add:admin', 'callback', ctx.from && (ctx.from.username || ctx.from.first_name)); } catch(_) {}
		try { await ctx.sendChatAction('typing'); } catch(_) {}
		if (!isAdmin(ctx)) return ctx.answerCbQuery('Hanya admin.');

		const text = `Menambahkan Admin\n\nSilakan kirim Telegram user id yang ingin ditambahkan sebagai admin. Contoh:\n123456789`;
		const keyboard = Markup.inlineKeyboard([
			[{text: 'Back', icon_custom_emoji_id: emojiMap.backs, callback_data: 'admin:add:menu', style: btn.red}, {text: 'Menu', icon_custom_emoji_id: emojiMap.homes, callback_data: 'home', style: btn.green}]
		]);
		const chatId = ctx.from && ctx.from.id;
		if (chatId) {
			sessions[chatId] = { mode: 'add_admin' };
			try {
				const msg = ctx.update && ctx.update.callback_query && ctx.update.callback_query.message;
				if (msg && msg.message_id) sessions[chatId].promptMessageId = msg.message_id;
			} catch (_) {}
		}
		try { await ctx.editMessageText(text, keyboard); } catch (e) { await ctx.reply(text, keyboard); }
	});

	bot.action('admin:add:emoji', async (ctx) => {
		try { if (logger) logger.callback && logger.callback('admin:add:emoji', 'callback', ctx.from && (ctx.from.username || ctx.from.first_name)); } catch(_) {}
		try { await ctx.sendChatAction('typing'); } catch(_) {}
		if (!isAdmin(ctx)) return ctx.answerCbQuery('Hanya admin.');

		const text = `Menambahkan Emoji\n\nSilakan kirim mapping emoji baru dalam format: <key>|<customEmojiId>\nContoh:\nchatgpt|6219584068808356078`;
		const keyboard = Markup.inlineKeyboard([
			[{text: 'Back', icon_custom_emoji_id: emojiMap.backs, callback_data: 'admin:add:menu', style: btn.red}, {text: 'Menu', icon_custom_emoji_id: emojiMap.homes, callback_data: 'home', style: btn.green}]
		]);
		const chatId = ctx.from && ctx.from.id;
		if (chatId) {
			sessions[chatId] = { mode: 'add_emoji' };
			try {
				const msg = ctx.update && ctx.update.callback_query && ctx.update.callback_query.message;
				if (msg && msg.message_id) sessions[chatId].promptMessageId = msg.message_id;
			} catch (_) {}
		}
		try { await ctx.editMessageText(text, keyboard); } catch (e) { await ctx.reply(text, keyboard); }
	});

	bot.action('admin:add:menu', async (ctx) => {
		try { if (logger) logger.callback && logger.callback('admin:add:menu', 'callback', ctx.from && (ctx.from.username || ctx.from.first_name)); } catch(_) {}
		if (!isAdmin(ctx)) return ctx.answerCbQuery('Hanya admin.');
		return sendAddMenu(ctx);
	});

	bot.action(/admin:add:product:category:(.+)/, async (ctx) => {
		try { if (logger) logger.callback && logger.callback('admin:add:product:category', 'callback', ctx.from && (ctx.from.username || ctx.from.first_name)); } catch(_) {}
		if (!isAdmin(ctx)) return ctx.answerCbQuery('Hanya admin.');
		const match = ctx.match;
		const categoryId = match && match[1];
		if (!categoryId) return ctx.answerCbQuery('Produk tidak valid');
		const chatId = ctx.from && ctx.from.id;
		if (chatId) {
			sessions[chatId] = { mode: 'add_product', category: categoryId };
			try {
				const msg = ctx.update && ctx.update.callback_query && ctx.update.callback_query.message;
				if (msg && msg.message_id) sessions[chatId].promptMessageId = msg.message_id;
			} catch (_) {}
		}
		try { await ctx.editMessageText('Silakan kirim varian satu per baris dengan format:\n<id> | <nama> | <harga> | <deskripsi>\nContoh:\ncc_pro | CapCut Pro | 2000 | Capcut pro 1 bulan', Markup.inlineKeyboard([[{text: 'Back', icon_custom_emoji_id: emojiMap.backs, callback_data: 'admin:add:menu', style: btn.red}]])); }
		catch (e) { await ctx.reply('Silakan kirim varian satu per baris dengan format:\n<id> | <nama> | <harga> | <deskripsi>\nContoh:\ncc_pro | CapCut Pro | 2000 | Capcut pro 1 bulan', Markup.inlineKeyboard([[{text: 'Back', icon_custom_emoji_id: emojiMap.backs, callback_data: 'admin:add:menu', style: btn.red}]])); }
	});

	bot.action(/admin:add:stock:category:(.+)/, async (ctx) => {
		try { if (logger) logger.callback && logger.callback('admin:add:stock:category', 'callback', ctx.from && (ctx.from.username || ctx.from.first_name)); } catch(_) {}
		if (!isAdmin(ctx)) return ctx.answerCbQuery('Hanya admin.');
		const match = ctx.match;
		const categoryId = match && match[1];
		if (!categoryId) return ctx.answerCbQuery('Produk tidak valid');
		const chatId = ctx.from && ctx.from.id;
		if (chatId) {
			sessions[chatId] = { mode: 'add_stock', category: categoryId };
			try {
				const msg = ctx.update && ctx.update.callback_query && ctx.update.callback_query.message;
				if (msg && msg.message_id) sessions[chatId].promptMessageId = msg.message_id;
			} catch (_) {}
		}
		const kb = listVariantsKeyboard(categoryId);
		if (!kb) {
			return ctx.reply('Belum ada varian di produk ini. Tambahkan varian terlebih dahulu.');
		}
		try { await ctx.editMessageText('Pilih varian untuk menambahkan stock:', kb); } catch (e) { await ctx.reply('Pilih varian untuk menambahkan stock:', kb); }
	});

	bot.action(/admin:add:stock:product:([^:]+):(.+)/, async (ctx) => {
		try { if (logger) logger.callback && logger.callback('admin:add:stock:product', 'callback', ctx.from && (ctx.from.username || ctx.from.first_name)); } catch(_) {}
		if (!isAdmin(ctx)) return ctx.answerCbQuery('Hanya admin.');
		const match = ctx.match;
		const categoryId = match && match[1];
		const productId = match && match[2];
		if (!categoryId || !productId) return ctx.answerCbQuery('Varian tidak valid');
		const chatId = ctx.from && ctx.from.id;
		if (chatId) {
			sessions[chatId] = { mode: 'add_stock', category: categoryId, product: productId };
			try {
				const msg = ctx.update && ctx.update.callback_query && ctx.update.callback_query.message;
				if (msg && msg.message_id) sessions[chatId].promptMessageId = msg.message_id;
			} catch (_) {}
		}
		const text = `Menambahkan Stock\n\nSilakan kirim stock satu per baris. Contoh:\nstock\nstock1\nstock2\nstock3`;
		const keyboard = Markup.inlineKeyboard([[{text: 'Back', icon_custom_emoji_id: emojiMap.backs, callback_data: 'admin:add:menu', style: btn.red}, {text: 'Menu', icon_custom_emoji_id: emojiMap.homes, callback_data: 'home', style: btn.green}]]);
		try { await ctx.editMessageText(text, keyboard); } catch (e) { await ctx.reply(text, keyboard); }
	});

	bot.on('message', async (ctx, next) => {
		const chatId = ctx.from && ctx.from.id;
		if (!chatId) return next();
		const session = sessions[chatId];
		if (!session || !session.mode) return next();
		const text = (ctx.message && ctx.message.text) ? ctx.message.text.trim() : '';
		if (!text) return next();
		if (text.startsWith('/')) return next();

		if (session.mode === 'add_category') {
			const parts = text.split('|').map(p => p.trim()).filter(p => p);
			if (parts.length < 2) return ctx.reply('Format salah. Gunakan: <id>|<nama>|<icon>\nContoh:\ncc|CapCut|capcut');
			const [id, name, icon] = parts;
			const normalizedId = String(id).trim().toLowerCase();
			const products = readJsonFile(productPath, []);
			if (products.find(p => String(p.id).trim().toLowerCase() === normalizedId)) {
				const msgText = `${Emoji.denied} ID produk sudah ada.`;
				const entities = buildEmojiEntities(msgText);
				return ctx.reply(msgText, { entities });
			}
			products.push({ id, name, icon: icon || id, items: [] });
			writeJsonFile(productPath, products);
			const promptId = sessions[chatId] && sessions[chatId].promptMessageId;
			try { if (promptId) await ctx.telegram.deleteMessage(ctx.chat.id, promptId); } catch (_) {}
			clearSession(chatId);
			const msgText = `${Emoji.check} Produk ${name} (${id}) berhasil ditambahkan.`;
			const entities = buildEmojiEntities(msgText);
			const keyboard = Markup.inlineKeyboard([
				[{text: 'Back', icon_custom_emoji_id: emojiMap.backs, callback_data: 'admin:add:menu', style: btn.red}, {text: 'Menu', icon_custom_emoji_id: emojiMap.homes, callback_data: 'home', style: btn.green}]
			]);
			return ctx.reply(msgText, { entities, ...keyboard });
		}

		if (session.mode === 'add_admin') {
			const id = text.split(/\r?\n/)[0].trim();
			if (!id || isNaN(Number(id))) return ctx.reply('ID tidak valid. Kirim user id numerik.');

			const users = readJsonFile(userPath, []);
			const exists = Array.isArray(users) ? users.find(u => String(u.id) === String(id)) : null;
			if (!exists) return ctx.reply('User belum pernah chat bot. Tidak dapat menambahkan sebagai admin.');

			const cfg = readJsonFile(configPath, {});
			if (!cfg.bot) cfg.bot = {};
			if (!Array.isArray(cfg.bot.adminId)) cfg.bot.adminId = [];
			if (!cfg.bot.adminId.map(String).includes(String(id))) cfg.bot.adminId.push(Number(id));
			writeJsonFile(configPath, cfg);
			const promptId = sessions[chatId] && sessions[chatId].promptMessageId;
			try { if (promptId) await ctx.telegram.deleteMessage(ctx.chat.id, promptId); } catch (_) {}
			clearSession(chatId);
			const msgText = `${Emoji.check} Admin ${id} berhasil ditambahkan.`;
			const entities = buildEmojiEntities(msgText);
			const keyboard = Markup.inlineKeyboard([
				[{text: 'Back', icon_custom_emoji_id: emojiMap.backs, callback_data: 'admin:add:menu', style: btn.red}, {text: 'Menu', icon_custom_emoji_id: emojiMap.homes, callback_data: 'home', style: btn.green}]
			]);
			try { await ctx.reply(msgText, { entities, ...keyboard }); } catch (_) {}

			try {
				await ctx.telegram.sendMessage(Number(id), `${Emoji.check} Anda telah ditambahkan sebagai admin di ${config && config.bot && config.bot.shopName ? config.bot.shopName : 'bot'}.`);
			} catch (_) {}
			return;
		}

		if (session.mode === 'add_emoji') {
			const parts = text.split('|').map(p => p.trim()).filter(p => p);
			if (parts.length !== 2) {
				return ctx.reply('Format salah. Gunakan: <key>|<customEmojiId>\nContoh:\nchatgpt|6219584068808356078');
			}
			const [key, customEmojiId] = parts;
			if (!key || !customEmojiId) {
				return ctx.reply('Key dan customEmojiId harus diisi.');
			}
			const emojiMapFile = readJsonFile(emojiMapPath, {});
			if (typeof emojiMapFile !== 'object' || Array.isArray(emojiMapFile)) {
				return ctx.reply('Data emojiMap tidak valid.');
			}
			if (Object.prototype.hasOwnProperty.call(emojiMapFile, key)) {
				return ctx.reply('Emoji key sudah ada. Gunakan key lain.');
			}
			emojiMapFile[key] = customEmojiId;
			writeJsonFile(emojiMapPath, emojiMapFile);
			const promptId = sessions[chatId] && sessions[chatId].promptMessageId;
			try { if (promptId) await ctx.telegram.deleteMessage(ctx.chat.id, promptId); } catch (_) {}
			clearSession(chatId);
			const msgText = `${Emoji.check} Emoji ${key} berhasil ditambahkan.`;
			const entities = buildEmojiEntities(msgText);
			const keyboard = Markup.inlineKeyboard([
				[{text: 'Back', icon_custom_emoji_id: emojiMap.backs, callback_data: 'admin:add:menu', style: btn.red}, {text: 'Menu', icon_custom_emoji_id: emojiMap.homes, callback_data: 'home', style: btn.green}]
			]);
			return ctx.reply(msgText, { entities, ...keyboard });
		}

		if (session.mode === 'add_product') {
			const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l);
			const products = readJsonFile(productPath, []);
			const prod = products.find(c => String(c.id) === String(session.category));
			if (!prod) return ctx.reply('Produk tidak ditemukan.');
			prod.items = prod.items || [];
			const existingIds = new Set(prod.items.map(item => String(item.id)));
			const newIds = new Set();
			const duplicateIds = [];
			let added = 0;
			for (const line of lines) {
				const parts = line.split('|').map(p => p.trim());
				if (parts.length < 4) continue;
				const [pid, pname, priceStr, desc] = parts;
				if (!pid || !pname) continue;
				const idKey = String(pid);
				if (existingIds.has(idKey) || newIds.has(idKey)) {
					duplicateIds.push(idKey);
					continue;
				}
				newIds.add(idKey);
				const price = Number(priceStr.replace(/[^0-9]/g, '')) || 0;
				prod.items.push({ id: pid, name: pname, price, description: desc, stock: [], icon: prod.icon || pid });
				added++;
			}
			if (duplicateIds.length > 0) {
				const msgText = `${Emoji.denied} ID varian tidak boleh sama: ${[...new Set(duplicateIds)].join(', ')}`;
				const entities = buildEmojiEntities(msgText);
				return ctx.reply(msgText, { entities });
			}
			writeJsonFile(productPath, products);
			const promptId = sessions[chatId] && sessions[chatId].promptMessageId;
			try { if (promptId) await ctx.telegram.deleteMessage(ctx.chat.id, promptId); } catch (_) {}
			clearSession(chatId);
			const msgText = `${Emoji.check} Berhasil menambahkan ${added} varian ke produk ${prod.name || prod.id}.`;
			const entities = buildEmojiEntities(msgText);
			const keyboard = Markup.inlineKeyboard([
				[{text: 'Back', icon_custom_emoji_id: emojiMap.backs, callback_data: 'admin:add:menu', style: btn.red}, {text: 'Menu', icon_custom_emoji_id: emojiMap.homes, callback_data: 'home', style: btn.green}]
			]);
			try { await ctx.sendChatAction('typing'); } catch (_) {}
			await ctx.reply(msgText, { entities, ...keyboard });
		}

		if (session.mode === 'add_stock') {
			const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l);
			if (lines.length === 0) return ctx.reply('Format salah. Kirim stock satu per baris. Contoh:\nstock\nstock1\nstock2\nstock3');
			const products = readJsonFile(productPath, []);
			const prod = products.find(c => String(c.id) === String(session.category));
			if (!prod) return ctx.reply('Produk tidak ditemukan.');
			const item = Array.isArray(prod.items) ? prod.items.find(i => String(i.id) === String(session.product)) : null;
			if (!item) return ctx.reply('Varian tidak ditemukan.');
			item.stock = Array.isArray(item.stock) ? item.stock : [];
			const existingStock = new Set(item.stock.map(s => String(s)));
			const newStock = new Set();
			const duplicateStock = [];
			let added = 0;
			for (const line of lines) {
				if (!line) continue;
				if (existingStock.has(line) || newStock.has(line)) {
					duplicateStock.push(line);
					continue;
				}
				newStock.add(line);
				item.stock.push(line);
				added++;
			}
			writeJsonFile(productPath, products);
			const promptId = sessions[chatId] && sessions[chatId].promptMessageId;
			try { if (promptId) await ctx.telegram.deleteMessage(ctx.chat.id, promptId); } catch (_) {}
			clearSession(chatId);
			let msgText = `${Emoji.check} Berhasil menambahkan ${added} stock ke varian ${item.name || item.id}.`;
			if (duplicateStock.length > 0) {
				msgText += `\nBeberapa stock tidak ditambahkan karena duplikat: ${[...new Set(duplicateStock)].join(', ')}`;
			}
			const entities = buildEmojiEntities(msgText);
			const keyboard = Markup.inlineKeyboard([
				[{text: 'Back', icon_custom_emoji_id: emojiMap.backs, callback_data: 'admin:add:menu', style: btn.red}, {text: 'Menu', icon_custom_emoji_id: emojiMap.homes, callback_data: 'home', style: btn.green}]
			]);
			try { await ctx.sendChatAction('typing'); } catch (_) {}
			return ctx.reply(msgText, { entities, ...keyboard });
		}
	});
};

module.exports.sendAddMenu = sendAddMenu;