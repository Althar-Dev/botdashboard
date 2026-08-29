const path = require('path');
const fs = require('fs');
const { Markup } = require('telegraf');
const { startAction } = require('../commands/start');
const { Emoji, emojiMap, buildEmojiEntities, buildEmojiHtml } = require('../../events/emojiMap');
const { sendPurchaseReceipt } = require('../../events/receipt');
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

const writeJsonFile = (filePath, value) => {
    try {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8');
    } catch (error) {
        console.error(`Error writing JSON file ${filePath}:`, error);
    }
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

const readEmojiMapJson = () => {
    const map = readJsonFile(emojiMapJsonPath, {});
    if (typeof map !== 'object' || !map || Array.isArray(map)) return {};
    return Object.keys(map).reduce((acc, key) => {
        acc[key] = map[key];
        return acc;
    }, {});
};

const formatCurrency = (value) => {
    const number = Number(value || 0);
    return Number.isFinite(number) ? number.toLocaleString('id-ID') : '0';
};

const getProductById = (productId) => {
    const products = readJsonFile(productDbPath, []);
    return Array.isArray(products) ? products.find((p) => String(p.id) === String(productId)) : null;
};

const PAGE_SIZE = 8;

// Screen 1: Build Inline Keyboard for Main Products
const buildMainProductsKeyboard = (page = 1) => {
    const products = readJsonFile(productDbPath, []);
    if (!Array.isArray(products) || products.length === 0) return null;
    const perRow = Number(config?.bot?.btnPrd) || 4;
    const perRowClamped = Math.max(1, Math.min(8, perRow));
    const pageCount = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
    const currentPage = Math.max(1, Math.min(page, pageCount));
    const start = (currentPage - 1) * PAGE_SIZE;
    const pageItems = products.slice(start, start + PAGE_SIZE);
    const chunk = (arr, size) => {
        const out = [];
        for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
        return out;
    };
    const emojiMapDb = readEmojiMapJson();
    const buttons = pageItems.map((product, index) => {
        const num = index + 1;
        const iconEntry = product.icon ? (emojiMapDb[product.icon] || emojiMap[product.icon]) : undefined;
        const iconId = normalizeCustomEmojiId(iconEntry);
        return {
            text: String(num),
            callback_data: `product:select:${product.id}`,
            style: btn.blue,
            ...(iconId ? { icon_custom_emoji_id: iconId } : {})
        };
    });
    const rows = chunk(buttons, perRowClamped);
    const pagination = [];
    if (currentPage > 1) {
        pagination.push({ text: ' ', icon_custom_emoji_id: emojiMap.left, callback_data: `product:page:${currentPage - 1}`, style: btn.red });
    }
    if (currentPage < pageCount) {
        pagination.push({ text: ' ', icon_custom_emoji_id: emojiMap.right, callback_data: `product:page:${currentPage + 1}`, style: btn.green });
    }
    if (pagination.length > 0) rows.push(pagination);
    rows.push([
        { text: 'Menu', icon_custom_emoji_id: emojiMap.homes, callback_data: 'home', style: btn.green }
    ]);
    return Markup.inlineKeyboard(rows);
};

// Screen 1: Send Main Products Screen
const sendMainProductsScreen = async (ctx, page = 1, logger) => {
    try { if (logger) logger.callback && logger.callback('product', 'callback', ctx.from && (ctx.from.username || ctx.from.first_name)); } catch (_) { }
    try { await ctx.sendChatAction('typing'); } catch (_) { }

    const products = readJsonFile(productDbPath, []);
    if (!Array.isArray(products) || products.length === 0) {
        return ctx.answerCbQuery(
            'Belum ada produk. Silakan hubungi admin.',
            { show_alert: true }
        );
    }

    const pageCount = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
    const currentPage = Math.max(1, Math.min(page, pageCount));
    const start = (currentPage - 1) * PAGE_SIZE;
    const pageItems = products.slice(start, start + PAGE_SIZE);

    const keyboard = buildMainProductsKeyboard(currentPage);

    const productLines = pageItems.map((product, index) => {
        const num = index + 1;
        const iconKey = product.icon || '';
        const iconEmoji = Emoji[iconKey] || '📦';
        return `${num}. ${iconEmoji} ${product.name || product.id}`;
    });

    const header = `┌${Emoji.althardev} <b>${config.bot.shopName}</b>\n└─────${Emoji.pr1}${Emoji.pr2}${Emoji.pr3}${Emoji.pr4}`;
    const body = productLines.join('\n');
    const footer = `\n<em>Silakan pilih produk yang anda inginkan.</em>`;

    const msgText = buildEmojiHtml(`${header}\n\nPilih Produk\nTersedia ${products.length} Produk\n\n${body}\n${footer}`);

    try {
        return await ctx.editMessageText(msgText, { ...keyboard, parse_mode: 'HTML' });
    } catch (err) {
        return await ctx.reply(msgText, { ...keyboard, parse_mode: 'HTML' });
    }
};

// Screen 2: Build Inline Keyboard for Variants under Selected Product
const buildVariantsKeyboard = (productId, page = 1) => {
    const product = getProductById(productId);
    if (!product || !Array.isArray(product.items) || product.items.length === 0) return null;

    const variants = product.items;
    const perRow = Number(config?.bot?.btnPrd) || 4;
    const perRowClamped = Math.max(1, Math.min(8, perRow));
    const pageCount = Math.max(1, Math.ceil(variants.length / PAGE_SIZE));
    const currentPage = Math.max(1, Math.min(page, pageCount));
    const start = (currentPage - 1) * PAGE_SIZE;
    const pageVariants = variants.slice(start, start + PAGE_SIZE);
    const chunk = (arr, size) => {
        const out = [];
        for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
        return out;
    };
    const emojiMapDb = readEmojiMapJson();
    const prodIconEntry = product.icon ? (emojiMapDb[product.icon] || emojiMap[product.icon]) : undefined;
    const prodIconId = normalizeCustomEmojiId(prodIconEntry);

    const buttons = pageVariants.map((variant, index) => {
        const num = index + 1;
        const variantIconEntry = variant.icon ? (emojiMapDb[variant.icon] || emojiMap[variant.icon]) : undefined;
        const iconId = normalizeCustomEmojiId(variantIconEntry) || prodIconId;
        return {
            text: String(num),
            callback_data: `checkout:${productId}:${variant.id}`,
            style: btn.blue,
            ...(iconId ? { icon_custom_emoji_id: iconId } : {})
        };
    });
    const rows = chunk(buttons, perRowClamped);
    const pagination = [];
    if (currentPage > 1) {
        pagination.push({ text: ' ', icon_custom_emoji_id: emojiMap.left, callback_data: `product:select:${productId}:page:${currentPage - 1}`, style: btn.red });
    }
    if (currentPage < pageCount) {
        pagination.push({ text: ' ', icon_custom_emoji_id: emojiMap.right, callback_data: `product:select:${productId}:page:${currentPage + 1}`, style: btn.green });
    }
    if (pagination.length > 0) rows.push(pagination);
    rows.push([
        { text: 'Back', icon_custom_emoji_id: emojiMap.backs, callback_data: 'product', style: btn.red },
        { text: 'Menu', icon_custom_emoji_id: emojiMap.homes, callback_data: 'home', style: btn.green }
    ]);
    return Markup.inlineKeyboard(rows);
};

// Screen 2: Send Variants Screen for Selected Product
const sendVariantsScreen = async (ctx, productId, page = 1, logger) => {
    try { if (logger) logger.callback && logger.callback('product:select', 'callback', ctx.from && (ctx.from.username || ctx.from.first_name)); } catch (_) { }
    try { await ctx.sendChatAction('typing'); } catch (_) { }

    const product = getProductById(productId);
    if (!product) return ctx.answerCbQuery('Produk tidak ditemukan.');

    const variants = Array.isArray(product.items) ? product.items : [];
    if (variants.length === 0) {
        return ctx.answerCbQuery(
            'Produk ini belum memiliki varian. Silakan pilih produk lain.',
            { show_alert: true }
        );
    }

    const pageCount = Math.max(1, Math.ceil(variants.length / PAGE_SIZE));
    const currentPage = Math.max(1, Math.min(page, pageCount));
    const start = (currentPage - 1) * PAGE_SIZE;
    const pageVariants = variants.slice(start, start + PAGE_SIZE);

    const keyboard = buildVariantsKeyboard(productId, currentPage);

    const variantLines = pageVariants.map((variant, index) => {
        const num = index + 1;
        const stockCount = Array.isArray(variant.stock) ? variant.stock.length : 0;
        const iconKey = variant.icon || product.icon || '';
        const iconEmoji = Emoji[iconKey] || '📦';
        const name = variant.name || variant.id;
        return `${num}. ${iconEmoji} ${name} · Rp ${formatCurrency(variant.price)} (${stockCount})`;
    });

    const header = `┌${Emoji.althardev} <b>${config.bot.shopName}</b>\n└─────${Emoji.pr1}${Emoji.pr2}${Emoji.pr3}${Emoji.pr4}`;
    const body = variantLines.join('\n');
    const footer = `\n<em>Silakan pilih varian yang anda inginkan.</em>`;

    const msgText = buildEmojiHtml(`${header}\n\nPilih Varian dari <b>${product.name || product.id}</b>\nTersedia ${variants.length} Varian\n\n${body}\n${footer}`);

    try {
        return await ctx.editMessageText(msgText, { ...keyboard, parse_mode: 'HTML' });
    } catch (err) {
        return await ctx.reply(msgText, { ...keyboard, parse_mode: 'HTML' });
    }
};

module.exports = (bot, logger) => {
    bot.action('product', async (ctx) => {
        await sendMainProductsScreen(ctx, 1, logger);
    });

    bot.action(/product:page:(\d+)/, async (ctx) => {
        const page = Number(ctx.match && ctx.match[1]) || 1;
        await sendMainProductsScreen(ctx, page, logger);
    });

    bot.action(/product:select:([^:]+):page:(\d+)/, async (ctx) => {
        const match = ctx.match;
        const productId = match && match[1];
        const page = Number(match && match[2]) || 1;
        await sendVariantsScreen(ctx, productId, page, logger);
    });

    bot.action(/product:select:(.+)/, async (ctx) => {
        const match = ctx.match;
        const productId = match && match[1];
        await sendVariantsScreen(ctx, productId, 1, logger);
    });

    // Fallback compatibility for category action links
    bot.action(/product:category:(.+)/, async (ctx) => {
        const match = ctx.match;
        const productId = match && match[1];
        const product = getProductById(productId);
        if (product) {
            await sendVariantsScreen(ctx, productId, 1, logger);
        } else {
            await sendMainProductsScreen(ctx, 1, logger);
        }
    });
};
