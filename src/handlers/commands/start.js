const { Markup } = require('telegraf');
const fs = require('fs');
const path = require('path');
const { Emoji, emojiMap, buildEmojiEntities, buildEmojiHtml } = require('../../events/emojiMap');
const btn = require('../../events/style');
const config = require('../../database/config.json');
const userDbPath = path.join(__dirname, '..', '..', 'database', 'user.json');
const statsDbPath = path.join(__dirname, '..', '..', 'database', 'stats.json');
const productDbPath = path.join(__dirname, '..', '..', 'database', 'product.json');

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
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8');
    } catch (error) {
        console.error(`Error writing JSON file ${filePath}:`, error);
    }
};

const isAdmin = (ctx) => {
    const adminList = (config && config.bot && Array.isArray(config.bot.adminId)) ? config.bot.adminId : [];
    const id = ctx.from && ctx.from.id;
    if (!id) return false;
    return adminList.map(String).includes(String(id));
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

const getProductStats = () => {
    const products = readJsonFile(productDbPath, []);
    if (!Array.isArray(products)) return { totalProducts: 0, totalVariants: 0 };
    const totalProducts = products.length;
    let totalVariants = 0;
    for (const category of products) {
        if (Array.isArray(category.items)) {
            totalVariants += category.items.length;
        }
    }
    return { totalProducts, totalVariants };
};

const registerUser = (userId, username) => {
    const users = readJsonFile(userDbPath, []);
    const existing = Array.isArray(users) ? users.find((user) => user.id === userId) : null;

    if (existing) {
        return existing;
    }

    const newUser = {
        id: userId,
        username: username || null,
        createdAt: new Date().toISOString(),
        transaksi: 0,
        saldo: 0
    };

    const nextUsers = Array.isArray(users) ? [...users, newUser] : [newUser];
    writeJsonFile(userDbPath, nextUsers);

    const stats = getStats();

    const nextStats = {
        totalUser: Number(stats.totalUser || 0) + 1,
        productsSold: Number(stats.productsSold || 0),
        uptime: stats.uptime || '99.9%'
    };
    writeJsonFile(statsDbPath, nextStats);

    return newUser;
};

const handleStart = async (ctx, logger) => {
    const userId = ctx.from?.id;
    const username = ctx.from?.username;
    const channelId = config.bot.channel;

    const user = registerUser(userId, username);
    const stats = getStats();
    const productStats = getProductStats();

    const userInfo = `${Emoji.user} <b>User Info</b> ──────────────╮
  ├ ID : ${user.id}
  ├ Username : ${user.username ? `@${user.username}` : '-'}
  ├ Transaksi : ${user.transaksi.toLocaleString('id-ID')}
  ├ Saldo Tersedia : Rp ${user.saldo.toLocaleString('id-ID')}
  ╰─────────────────────╯`;

    const botStats = `${Emoji.bot} <b>Bot Stats</b> ──────────────╮
  ├ Total User : ${Number(stats.totalUser || 0).toLocaleString('id-ID')}
  ├ Total Product : ${productStats.totalProducts.toLocaleString('id-ID')}
  ├ Total Variant : ${productStats.totalVariants.toLocaleString('id-ID')}
  ├ Products Sold : ${Number(stats.productsSold || 0).toLocaleString('id-ID')}
  ├ Uptime : ${stats.uptime}
  ╰─────────────────────╯`;

    const sendVerifyMessage = async () => {
        try { await ctx.sendChatAction('typing'); } catch (_) { }
        const verifyText = buildEmojiHtml(
            `┌${Emoji.althardev} <b>${config.bot.shopName}</b>\n` +
            `└──${Emoji.shield} <b>Verifikasi Akun</b>\n\n` +
            `${Emoji.hilo} Halo <b>${username ? `@${username}` : (ctx.from?.first_name || 'User')}</b>,\n\n` +
            `Untuk menggunakan bot ini, Anda harus bergabung dengan channel official kami terlebih dahulu.\n\n` +
            `╭─────────────────────╮\n` +
            `├ ${Emoji.check} Akses penuh ke semua fitur\n` +
            `├ ${Emoji.check} Notifikasi deposit & order\n` +
            `├ ${Emoji.check} Update fitur terbaru\n` +
            `├ ${Emoji.check} Support prioritas\n` +
            `╰─────────────────────╯\n\n` +
            `<i>Setelah bergabung, silakan tekan tombol <b>Refresh</b> di bawah ini.</i>`
        );

        const keyboard = Markup.inlineKeyboard([
            [{ text: 'Join Channel', icon_custom_emoji_id: emojiMap.telegram, url: `https://t.me/${channelId.replace('@', '')}`, style: btn.blue }],
            [{ text: 'Refresh', icon_custom_emoji_id: emojiMap.refresh, callback_data: 'refresh_start', style: btn.green }]
        ]);

        return ctx.reply(verifyText, {
            parse_mode: 'HTML',
            ...keyboard
        });
    };

    try {
        const chatMember = await ctx.telegram.getChatMember(channelId, userId);
        const isSubscribed = ['member', 'administrator', 'creator'].includes(chatMember.status);

        if (isSubscribed) {
            const rawText = `┌${Emoji.althardev} <b>${config.bot.shopName}</b>\n└──${Emoji.hilo} Halo <b>${username || 'User'}</b>\n\n${userInfo}\n\n${botStats}`;
            const messageText = buildEmojiHtml(rawText);
            try { await ctx.sendChatAction('typing'); } catch (_) { }

            const inlineRows = [
                [{ text: 'Belanja', icon_custom_emoji_id: emojiMap.cart2, callback_data: 'product', style: btn.green }],
                [{ text: 'Profil', icon_custom_emoji_id: emojiMap.user2, callback_data: 'profil', style: btn.blue }, { text: 'Deposit', icon_custom_emoji_id: emojiMap.depo, callback_data: 'deposit', style: btn.blue }],
                [{ text: 'Bantuan', icon_custom_emoji_id: emojiMap.telep, callback_data: 'support', style: btn.red }]
            ];

            if (isAdmin(ctx)) {
                inlineRows.push([
                    { text: 'Dashboard', icon_custom_emoji_id: emojiMap.lock || emojiMap.statsup, callback_data: 'admin_dashboard', style: btn.blue }
                ]);
            }

            const keyboard = Markup.inlineKeyboard(inlineRows);

            await ctx.reply(messageText, {
                parse_mode: 'HTML',
                message_effect_id: '5104841245755180586',
                ...keyboard
            });
        } else {
            await sendVerifyMessage();
        }
    } catch (error) {
        console.error(error);
        await sendVerifyMessage();
    }

    if (logger) logger.command('start', 'from', username || ctx.from?.first_name || 'unknown');
};

module.exports = (bot, logger) => {
    bot.start(async (ctx) => {
        await handleStart(ctx, logger);
    });
};

module.exports.startAction = handleStart;
