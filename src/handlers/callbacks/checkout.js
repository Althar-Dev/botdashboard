const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { Markup } = require('telegraf');
const { startAction } = require('../commands/start');
const { Emoji, emojiMap, buildEmojiEntities, buildEmojiHtml } = require('../../events/emojiMap');
const { sendPurchaseReceipt } = require('../../events/receipt');
const { qrisDinamisWithFee } = require('../payments/getQris');
const { checkPayment } = require('../payments/getStatus');
const btn = require('../../events/style');
const config = require('../../database/config.json');

const productDbPath = path.join(__dirname, '..', '..', 'database', 'product.json');
const userDbPath = path.join(__dirname, '..', '..', 'database', 'user.json');
const emojiMapJsonPath = path.join(__dirname, '..', '..', 'database', 'emojiMap.json');

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

const readEmojiMapJson = () => {
    const map = readJsonFile(emojiMapJsonPath, {});
    return typeof map === 'object' && map && !Array.isArray(map) ? map : {};
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

const formatCurrency = (value) => {
    const number = Number(value || 0);
    return Number.isFinite(number) ? number.toLocaleString('id-ID') : '0';
};

const normalizeCustomEmojiId = (raw) => {
    if (typeof raw === 'number' && Number.isFinite(raw)) return String(raw);
    if (typeof raw === 'string') {
        const trimmed = raw.trim();
        if (/^[0-9]+$/.test(trimmed)) return trimmed;
    }
    if (typeof raw === 'object' && raw !== null) {
        return normalizeCustomEmojiId(raw.id || raw.custom_emoji_id || raw.icon_custom_emoji_id);
    }
    return null;
};

const buildItemIconTag = (item) => {
    if (!item || !item.icon) return '';
    const emojiMapDb = readEmojiMapJson();
    const rawIcon = emojiMapDb[item.icon] || emojiMap[item.icon];
    const iconId = normalizeCustomEmojiId(rawIcon);
    const placeholder = Emoji[item.icon] || '🔑';
    return iconId ? `<tg-emoji emoji-id="${iconId}">${placeholder}</tg-emoji> ` : `${placeholder} `;
};

const getUserById = (userId) => {
    const users = readJsonFile(userDbPath, []);
    if (!Array.isArray(users)) return null;
    return users.find((user) => String(user.id) === String(userId)) || null;
};

const saveUsers = (users) => {
    writeJsonFile(userDbPath, users);
};

const getProductById = (productId) => {
    const products = readJsonFile(productDbPath, []);
    return Array.isArray(products) ? products.find((product) => String(product.id) === String(productId)) : null;
};

const getCategoryById = getProductById;

const generateRandomId = (length = 8) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const bytes = crypto.randomBytes(length);
    let id = '';
    for (let i = 0; i < length; i += 1) {
        id += chars[bytes[i] % chars.length];
    }
    return id;
};

const buildProductDetailKeyboard = (productId, item, qty = 1) => {
    const rows = [];
    const stockCount = Array.isArray(item.stock) ? item.stock.length : 0;
    if (stockCount > 0) {
        rows.push([
            { text: ' ', icon_custom_emoji_id: emojiMap.minus, callback_data: `checkout:qty:sub:${productId}:${item.id}:${qty}` },
            { text: `${qty}`, callback_data: `checkout:qty:info:${productId}:${item.id}:${qty}`, style: btn.blue },
            { text: ' ', icon_custom_emoji_id: emojiMap.add, callback_data: `checkout:qty:add:${productId}:${item.id}:${qty}` }
        ]);
        rows.push([
            { text: `Beli Sekarang (${qty})`, icon_custom_emoji_id: emojiMap.cart, callback_data: `checkout:buy:${productId}:${item.id}:${qty}`, style: btn.blue }
        ]);
    }
    rows.push([
        { text: 'Back', icon_custom_emoji_id: emojiMap.backs, callback_data: `product:select:${productId}`, style: btn.red },
        { text: 'Menu', icon_custom_emoji_id: emojiMap.homes, callback_data: 'home', style: btn.green }
    ]);
    return Markup.inlineKeyboard(rows);
};

const buildProductText = (product, item, qty = 1) => {
    const stockCount = Array.isArray(item.stock) ? item.stock.length : 0;
    const iconTag = buildItemIconTag(item);
    const productName = product ? (product.name || product.id) : '-';
    const totalPrice = Number(item.price || 0) * qty;
    const msgText = buildEmojiHtml(
        `┌${Emoji.cart} <b>Checkout Produk</b>\n└────${iconTag}${item.name || item.id}\n\n` +
        `<blockquote>╭─────────────────────╮\n` +
        `├ ${Emoji.rowr}<b>Produk:</b> ${productName}\n` +
        `├ ${Emoji.rowr}<b>Harga Satuan:</b> Rp ${formatCurrency(item.price)}\n` +
        `├ ${Emoji.rowr}<b>Jumlah Beli:</b> ${qty}\n` +
        `├ ${Emoji.rowr}<b>Total Harga:</b> Rp ${formatCurrency(totalPrice)}\n` +
        `├ ${Emoji.rowr}<b>Stok Tersedia:</b> ${stockCount}\n` +
        `╰─────────────────────╯</blockquote>\n\n` +
        `<b>Note:</b>\n${item.description || '-'}`
    );
    return { text: msgText, totalPrice };
};

const activeCheckoutPolls = {};

const clearCheckoutPoller = (chatId) => {
    if (activeCheckoutPolls[chatId]) {
        if (activeCheckoutPolls[chatId].intervalId) {
            clearInterval(activeCheckoutPolls[chatId].intervalId);
        }
        delete activeCheckoutPolls[chatId];
    }
};

const processSuccessfulCheckout = async (bot, ctx, categoryId, itemId, reference, finalAmount, messageId, qty = 1, logger) => {
    const chatId = ctx.chat?.id || ctx.from?.id;
    if (!chatId) return;

    const category = getCategoryById(categoryId);
    const item = category && Array.isArray(category.items) ? category.items.find((it) => String(it.id) === String(itemId)) : null;
    if (!item) return;

    const stockList = Array.isArray(item.stock) ? item.stock : [];
    if (stockList.length < qty) {
        try {
            await bot.telegram.sendMessage(chatId, `Maaf, pembayaran berhasil tetapi stok produk tidak mencukupi (Tersedia: ${stockList.length}, Diminta: ${qty}). Silakan hubungi admin.`, {
                ...Markup.inlineKeyboard([
                    [{ text: 'Menu', callback_data: 'home', style: btn.green }]
                ])
            });
        } catch (_) { }
        return;
    }

    const selectedStock = stockList.splice(0, qty);
    const stockCode = selectedStock.length === 1 ? selectedStock[0] : selectedStock.map((s, i) => `${i + 1}. ${s}`).join('\n');

    const products = readJsonFile(productDbPath, []);
    const productCategoryIndex = Array.isArray(products)
        ? products.findIndex((c) => String(c.id) === String(categoryId))
        : -1;
    if (productCategoryIndex !== -1) {
        const categoryItems = Array.isArray(products[productCategoryIndex].items)
            ? products[productCategoryIndex].items
            : [];
        const productIndex = categoryItems.findIndex((it) => String(it.id) === String(itemId));
        if (productIndex !== -1) {
            products[productCategoryIndex].items[productIndex].stock = stockList;
        }
    }
    writeJsonFile(productDbPath, products);

    const users = readJsonFile(userDbPath, []);
    const userIndex = Array.isArray(users) ? users.findIndex((u) => String(u.id) === String(chatId)) : -1;
    const orderId = `TRX-${generateRandomId()}`;
    const displayName = qty > 1 ? `${item.name || item.id} (${qty}x)` : (item.name || item.id);
    if (userIndex !== -1) {
        users[userIndex].transaksi = Number(users[userIndex].transaksi || 0) + 1;
        users[userIndex].order = Array.isArray(users[userIndex].order) ? users[userIndex].order : [];
        users[userIndex].order.push({
            id: orderId,
            product: displayName,
            price: finalAmount,
            method: 'qris',
            reference: reference,
            data: stockCode,
            status: 'success',
            date: new Date().toISOString()
        });
        saveUsers(users);
    }

    try {
        await sendPurchaseReceipt(ctx, {
            orderId: orderId,
            user: ctx.from,
            username: ctx.from?.username,
            serviceName: displayName,
            serviceIcon: item.icon,
            price: finalAmount,
            status: 'success',
            method: 'qris',
            phone: reference
        });
    } catch (err) {
        if (logger) logger.error && logger.error(String(err), 'receipt_qris');
    }

    const msgText = buildEmojiHtml(
        `┌${Emoji.althardev} <b>${config.bot.shopName}</b>\n` +
        `└──${Emoji.wallet} <strong>Pembayaran Sukses</strong> ${Emoji.check}\n\n` +
        `${Emoji.ref} <b>Invoice Detail</b>\n` +
        `<blockquote>${Emoji.rowr} Produk: ${displayName}\n${Emoji.rowr} Total Harga: Rp ${formatCurrency(finalAmount)}\n</blockquote>\n\n<strong>${Emoji.lock}Data:</strong><blockquote>${stockCode}</blockquote>\n\nNote:\n<em>${item.description}</em>`
    );
    const keyboard = Markup.inlineKeyboard([
        [{ text: 'Belanja Lagi', icon_custom_emoji_id: emojiMap.cart2, callback_data: 'product', style: btn.blue }],
        [{ text: 'Menu', icon_custom_emoji_id: emojiMap.homes, callback_data: 'home', style: btn.green }]
    ]);

    try { await bot.telegram.deleteMessage(chatId, messageId); } catch (_) { }
    try {
        await bot.telegram.sendMessage(chatId, msgText, { message_effect_id: '5046509860389126442', ...keyboard, parse_mode: 'HTML' });
    } catch (_) { }
};

const startCheckoutPolling = (bot, ctx, categoryId, itemId, reference, finalAmount, messageId, qty = 1, logger) => {
    const chatId = ctx.chat?.id || ctx.from?.id;
    if (!chatId) return;

    clearCheckoutPoller(chatId);

    let attempts = 0;
    const maxAttempts = 180;

    const intervalId = setInterval(async () => {
        attempts += 1;
        if (attempts > maxAttempts) {
            clearCheckoutPoller(chatId);
            try {
                await bot.telegram.editMessageCaption(
                    chatId,
                    messageId,
                    undefined,
                    `❌ <b>Pembayaran Kadaluarsa</b>\n\nNominal: Rp ${formatCurrency(finalAmount)}\nReference: ${reference}`,
                    { parse_mode: 'HTML' }
                );
            } catch (_) { }
            return;
        }

        try {
            const result = await checkPayment(reference, finalAmount);
            if (result && result.success) {
                clearCheckoutPoller(chatId);
                await processSuccessfulCheckout(bot, ctx, categoryId, itemId, reference, finalAmount, messageId, qty, logger);
            }
        } catch (err) {
            // ignore temporary polling errors
        }
    }, 5000);

    activeCheckoutPolls[chatId] = {
        intervalId,
        reference,
        messageId
    };
};

module.exports = (bot, logger) => {
    bot.action(/checkout:qty:(add|sub|info):([^:]+):([^:]+):(\d+)/, async (ctx) => {
        const action = ctx.match[1];
        const categoryId = ctx.match[2];
        const itemId = ctx.match[3];
        let currentQty = Number(ctx.match[4]) || 1;

        const category = getCategoryById(categoryId);
        if (!category) return ctx.answerCbQuery('Kategori tidak ditemukan.');
        const item = Array.isArray(category.items) ? category.items.find((it) => String(it.id) === String(itemId)) : null;
        if (!item) return ctx.answerCbQuery('Produk tidak ditemukan.');

        const stockCount = Array.isArray(item.stock) ? item.stock.length : 0;

        if (action === 'info') {
            return ctx.answerCbQuery(`Jumlah pembelian saat ini: ${currentQty}`);
        }

        if (action === 'add') {
            if (currentQty >= stockCount) {
                return ctx.answerCbQuery(`Stok maksimal yang tersedia: ${stockCount}`, { show_alert: true });
            }
            currentQty += 1;
        } else if (action === 'sub') {
            if (currentQty <= 1) {
                return ctx.answerCbQuery('Jumlah minimal pembelian adalah 1');
            }
            currentQty -= 1;
        }

        const { text } = buildProductText(category, item, currentQty);
        const keyboard = buildProductDetailKeyboard(categoryId, item, currentQty);
        try {
            await ctx.editMessageText(text, { reply_markup: keyboard.reply_markup, parse_mode: 'HTML' });
        } catch (_) { }
        try { await ctx.answerCbQuery(`Jumlah: ${currentQty}`); } catch (_) { }
    });

    bot.action(/checkout:([^:]+):([^:]+)$/, async (ctx) => {
        try { if (logger) logger.callback && logger.callback('checkout', 'callback', ctx.from && (ctx.from.username || ctx.from.first_name)); } catch (_) { }
        try { await ctx.sendChatAction('typing'); } catch (_) { }

        const match = ctx.match;
        const categoryId = match && match[1];
        const itemId = match && match[2];
        const category = getCategoryById(categoryId);
        if (!category) return ctx.answerCbQuery('Kategori tidak ditemukan.');
        const item = Array.isArray(category.items) ? category.items.find((it) => String(it.id) === String(itemId)) : null;
        if (!item) return ctx.answerCbQuery('Produk tidak ditemukan.');

        const stockCount = Array.isArray(item.stock) ? item.stock.length : 0;
        if (stockCount === 0) {
            try {
                await ctx.answerCbQuery('Maaf, produk ini sedang kosong stock.', { show_alert: true });
            } catch (_) {
                return null;
            }
        }

        const { text } = buildProductText(category, item, 1);
        const keyboard = buildProductDetailKeyboard(categoryId, item, 1);
        try {
            return await ctx.editMessageText(text, { reply_markup: keyboard.reply_markup, parse_mode: 'HTML' });
        } catch (err) {
            try { await ctx.deleteMessage(); } catch (_) { }
            return await ctx.reply(text, { reply_markup: keyboard.reply_markup, parse_mode: 'HTML' });
        }
    });

    bot.action(/checkout:buy:([^:]+):([^:]+)(?::(\d+))?/, async (ctx) => {
        try { if (logger) logger.callback && logger.callback('checkout:buy', 'callback', ctx.from && (ctx.from.username || ctx.from.first_name)); } catch (_) { }
        try { await ctx.sendChatAction('typing'); } catch (_) { }

        const match = ctx.match;
        const categoryId = match && match[1];
        const itemId = match && match[2];
        const qty = Number(match && match[3]) || 1;
        const category = getCategoryById(categoryId);
        if (!category) return ctx.answerCbQuery('Kategori tidak ditemukan.');
        const item = Array.isArray(category.items) ? category.items.find((it) => String(it.id) === String(itemId)) : null;
        if (!item) return ctx.answerCbQuery('Produk tidak ditemukan.');

        const stockCount = Array.isArray(item.stock) ? item.stock.length : 0;
        if (stockCount < qty) {
            try {
                await ctx.answerCbQuery(`Maaf, stok produk tidak mencukupi (Tersedia: ${stockCount}).`, { show_alert: true });
            } catch (_) { }
            return;
        }

        const { text } = buildProductText(category, item, qty);
        const totalPrice = Number(item.price || 0) * qty;
        const payKeyboard = Markup.inlineKeyboard([
            [{ text: `Bayar Saldo (Rp ${formatCurrency(totalPrice)})`, icon_custom_emoji_id: emojiMap.wallet, callback_data: `checkout:pay:saldo:${categoryId}:${itemId}:${qty}`, style: btn.blue }],
            [{ text: `Bayar QRIS (Rp ${formatCurrency(totalPrice)})`, icon_custom_emoji_id: emojiMap.qris, callback_data: `checkout:pay:qris:${categoryId}:${itemId}:${qty}`, style: btn.blue }],
            [{ text: 'Batal', callback_data: `checkout:${categoryId}:${itemId}`, style: btn.red }]
        ]);

        try { await ctx.deleteMessage(); } catch (_) { }
        try {
            return await ctx.reply(text, { reply_markup: payKeyboard.reply_markup, parse_mode: 'HTML' });
        } catch (err) {
            return await ctx.reply(text, { reply_markup: payKeyboard.reply_markup, parse_mode: 'HTML' });
        }
    });

    bot.action(/checkout:pay:saldo:([^:]+):([^:]+)(?::(\d+))?/, async (ctx) => {
        try { if (logger) logger.callback && logger.callback('checkout:pay:saldo', 'callback', ctx.from && (ctx.from.username || ctx.from.first_name)); } catch (_) { }
        try { await ctx.sendChatAction('typing'); } catch (_) { }
        try { await ctx.deleteMessage(); } catch (_) { }

        const userId = ctx.from?.id;
        const user = getUserById(userId);
        if (!user) {
            try { await ctx.answerCbQuery('Silakan mulai ulang bot dengan /start.', { show_alert: true }); } catch (_) { }
            return startAction(ctx, logger);
        }

        const match = ctx.match;
        const categoryId = match && match[1];
        const itemId = match && match[2];
        const qty = Number(match && match[3]) || 1;
        const category = getCategoryById(categoryId);
        if (!category) return ctx.answerCbQuery('Kategori tidak ditemukan.');
        const item = Array.isArray(category.items) ? category.items.find((it) => String(it.id) === String(itemId)) : null;
        if (!item) return ctx.answerCbQuery('Produk tidak ditemukan.');

        const totalPrice = Number(item.price || 0) * qty;
        if (user.saldo < totalPrice) {
            return ctx.reply(`Saldo Anda tidak cukup. Saldo saat ini: Rp ${formatCurrency(user.saldo)}, dibutuhkan Rp ${formatCurrency(totalPrice)}. Silakan deposit terlebih dahulu.`, Markup.inlineKeyboard([
                [{ text: 'Deposit', callback_data: 'deposit', style: btn.blue }],
                [{ text: 'Menu', callback_data: 'home', style: btn.green }]
            ]));
        }

        const stockList = Array.isArray(item.stock) ? item.stock : [];
        if (stockList.length < qty) {
            return ctx.reply(`Maaf, stok produk tidak mencukupi (Tersedia: ${stockList.length}, Diminta: ${qty}). Silakan pilih produk lain.`, Markup.inlineKeyboard([
                [{ text: 'Back', icon_custom_emoji_id: emojiMap.backs, callback_data: `product:category:${categoryId}`, style: btn.red }],
                [{ text: 'Menu', icon_custom_emoji_id: emojiMap.homes, callback_data: 'home', style: btn.green }]
            ]));
        }

        const selectedStock = stockList.splice(0, qty);
        const stockCode = selectedStock.length === 1 ? selectedStock[0] : selectedStock.map((s, i) => `${i + 1}. ${s}`).join('\n');

        const products = readJsonFile(productDbPath, []);
        const productCategoryIndex = Array.isArray(products)
            ? products.findIndex((category) => String(category.id) === String(categoryId))
            : -1;
        if (productCategoryIndex !== -1) {
            const categoryItems = Array.isArray(products[productCategoryIndex].items)
                ? products[productCategoryIndex].items
                : [];
            const productIndex = categoryItems.findIndex((it) => String(it.id) === String(itemId));
            if (productIndex !== -1) {
                products[productCategoryIndex].items[productIndex].stock = stockList;
            }
        }

        const users = readJsonFile(userDbPath, []);
        const userIndex = Array.isArray(users) ? users.findIndex((u) => String(u.id) === String(userId)) : -1;
        if (userIndex === -1) {
            return ctx.reply('Data pengguna tidak ditemukan. Silakan mulai ulang bot dengan /start.');
        }

        const orderId = `TRX-${generateRandomId()}`;
        const displayName = qty > 1 ? `${item.name || item.id} (${qty}x)` : (item.name || item.id);
        users[userIndex].saldo = Number(users[userIndex].saldo || 0) - totalPrice;
        users[userIndex].transaksi = Number(users[userIndex].transaksi || 0) + 1;
        users[userIndex].order = Array.isArray(users[userIndex].order) ? users[userIndex].order : [];
        users[userIndex].order.push({
            id: orderId,
            product: displayName,
            price: totalPrice,
            method: 'saldo',
            data: stockCode,
            status: 'success',
            date: new Date().toISOString()
        });
        saveUsers(users);
        writeJsonFile(productDbPath, products);

        const msgText = buildEmojiHtml(
            `┌${Emoji.althardev} <b>${config.bot.shopName}</b>\n` +
            `└──${Emoji.wallet} <strong>Pembayaran Sukses</strong> ${Emoji.check}\n\n` +
            `${Emoji.ref} <b>Invoice Detail</b>\n` +
            `<blockquote>${Emoji.rowr} Produk: ${displayName}\n${Emoji.rowr} Total Harga: Rp ${formatCurrency(totalPrice)}</blockquote>\n\n<strong>${Emoji.lock}Data:</strong>\n<blockquote>${stockCode}</blockquote>\n\nNote:\n<em>${item.description}</em>`
        );
        const keyboard = Markup.inlineKeyboard([
            [{ text: 'Belanja Lagi', icon_custom_emoji_id: emojiMap.cart2, callback_data: 'product', style: btn.blue }],
            [{ text: 'Menu', icon_custom_emoji_id: emojiMap.homes, callback_data: 'home', style: btn.green }]
        ]);

        try {
            await sendPurchaseReceipt(ctx, {
                orderId: orderId,
                user: ctx.from,
                username: ctx.from?.username,
                serviceName: displayName,
                serviceIcon: item.icon,
                price: totalPrice,
                status: 'success',
                method: 'saldo',
                phone: '-'
            });
        } catch (_) { }

        try { await ctx.deleteMessage(); } catch (_) { }
        return ctx.reply(msgText, { message_effect_id: '5046509860389126442', ...keyboard, parse_mode: 'HTML' });
    });

    bot.action(/checkout:pay:qris:([^:]+):([^:]+)(?::(\d+))?/, async (ctx) => {
        try { if (logger) logger.callback && logger.callback('checkout:pay:qris', 'callback', ctx.from && (ctx.from.username || ctx.from.first_name)); } catch (_) { }
        try { await ctx.sendChatAction('upload_photo'); } catch (_) { }
        try { await ctx.deleteMessage(); } catch (_) { }

        const chatId = ctx.chat?.id || ctx.from?.id;
        if (chatId) clearCheckoutPoller(chatId);

        const match = ctx.match;
        const categoryId = match && match[1];
        const itemId = match && match[2];
        const qty = Number(match && match[3]) || 1;
        const category = getCategoryById(categoryId);
        if (!category) return ctx.answerCbQuery('Kategori tidak ditemukan.');
        const item = Array.isArray(category.items) ? category.items.find((it) => String(it.id) === String(itemId)) : null;
        if (!item) return ctx.answerCbQuery('Produk tidak ditemukan.');

        const stockCount = Array.isArray(item.stock) ? item.stock.length : 0;
        if (stockCount < qty) {
            try {
                await ctx.answerCbQuery(`Maaf, stok produk tidak mencukupi (Tersedia: ${stockCount}).`, { show_alert: true });
            } catch (_) { }
            return;
        }

        const totalPrice = Number(item.price || 0) * qty;
        const tmpDir = path.join(__dirname, '..', '..', 'database', 'qris');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
        const outPath = path.join(tmpDir, `qris_${chatId}_${Date.now()}.png`);

        try {
            const { finalAmount, randomFee, reference } = await qrisDinamisWithFee(totalPrice, outPath, logger);
            const keyboard = Markup.inlineKeyboard([
                [{ text: '❌ Batal', callback_data: `checkout:cancel:qris:${categoryId}`, style: btn.red }]
            ]);

            const displayName = qty > 1 ? `${item.name || item.id} (${qty}x)` : (item.name || item.id);
            const captionText = buildEmojiHtml(
                `${Emoji.bill} <strong>QRIS Pembayaran</strong>\n\n` +
                `<blockquote>╭─────────────────────╮\n├ Produk: ${displayName}\n├ Nominal: Rp ${formatCurrency(finalAmount)}\n├ Fee: Rp ${formatCurrency(randomFee)}\n├ Reference: ${reference}\n╰─────────────────────╯</blockquote>\n\n` +
                `Silakan scan QRIS berikut untuk membayar. <em>Sistem akan otomatis mendeteksi pembayaran Anda...</em>`
            );
            const sentMsg = await ctx.replyWithPhoto({ source: outPath }, {
                caption: captionText,
                parse_mode: 'HTML',
                ...keyboard
            });
            try { fs.unlinkSync(outPath); } catch (_) { }
            try { await ctx.answerCbQuery(); } catch (_) { }

            startCheckoutPolling(bot, ctx, categoryId, itemId, reference, finalAmount, sentMsg.message_id, qty, logger);
            return;
        } catch (err) {
            if (logger) logger.error(`checkout qris error ${String(err)}`, 'checkout_qris');
            try { await ctx.answerCbQuery('Gagal generate QRIS.'); } catch (_) { }
            return;
        }
    });

    bot.action(/checkout:cancel:qris:(.+)/, async (ctx) => {
        const chatId = ctx.chat?.id || ctx.from?.id;
        if (chatId) clearCheckoutPoller(chatId);
        try { await ctx.answerCbQuery('Pembayaran dibatalkan.'); } catch (_) { }
        try { await ctx.deleteMessage(); } catch (_) { }
        const categoryId = ctx.match[1];
        return ctx.reply('Pembayaran QRIS telah dibatalkan.', Markup.inlineKeyboard([
            [{ text: 'Kembali ke Produk', callback_data: `product:category:${categoryId}`, style: btn.blue }],
            [{ text: 'Menu', callback_data: 'home', style: btn.green }]
        ]));
    });

    bot.action(/checkout:confirm:qris:([^:]+):([^:]+)(?::(\d+))?/, async (ctx) => {
        const chatId = ctx.chat?.id || ctx.from?.id;
        if (chatId) clearCheckoutPoller(chatId);
        try { if (logger) logger.callback && logger.callback('checkout:confirm:qris', 'callback', ctx.from && (ctx.from.username || ctx.from.first_name)); } catch (_) { }
        try { await ctx.sendChatAction('typing'); } catch (_) { }

        const match = ctx.match;
        const categoryId = match && match[1];
        const itemId = match && match[2];
        const qty = Number(match && match[3]) || 1;
        const category = getCategoryById(categoryId);
        if (!category) return ctx.answerCbQuery('Kategori tidak ditemukan.');
        const item = Array.isArray(category.items) ? category.items.find((it) => String(it.id) === String(itemId)) : null;
        if (!item) return ctx.answerCbQuery('Produk tidak ditemukan.');

        const paymentReference = ctx.callbackQuery?.message?.caption?.match(/Reference: (\S+)/)?.[1];
        if (!paymentReference) {
            try { await ctx.answerCbQuery('Tidak ada referensi pembayaran yang dapat diperiksa.', { show_alert: true }); } catch (_) { }
            return;
        }

        const amountMatch = ctx.callbackQuery?.message?.caption?.match(/Nominal: Rp ([\d,.]+)/)?.[1];
        const amountValue = amountMatch ? Number(amountMatch.replace(/\D/g, '')) : Number(item.price || 0) * qty;
        const result = await checkPayment(paymentReference, amountValue);

        if (!result.success) {
            if (logger) logger.error(`checkout qris not paid: ${result.message}`, 'checkout_qris');
            try { await ctx.answerCbQuery(result.message, { show_alert: true }); } catch (_) { }
            return;
        }

        await processSuccessfulCheckout(bot, ctx, categoryId, itemId, paymentReference, amountValue, ctx.callbackQuery?.message?.message_id, qty, logger);
    });
};
