const path = require('path');
const fs = require('fs');
const { Markup } = require('telegraf');
const { qrisDinamisWithFee } = require('../payments/getQris');
const { checkPayment } = require('../payments/getStatus');
const { sendDepositReceipt } = require('../../events/receipt');
const { Emoji, buildEmojiEntities, emojiMap, buildEmojiHtml } = require('../../events/emojiMap');
const btn = require('../../events/style');
const config = require('../../database/config.json');
const userDbPath = path.join(__dirname, '..', '..', 'database', 'user.json');

const sessions = {};
const activeDepositPolls = {};

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

const addUserBalance = (userId, amount) => {
    const users = readJsonFile(userDbPath, []);
    if (!Array.isArray(users)) return false;

    const userIndex = users.findIndex((user) => user.id === userId);
    if (userIndex === -1) {
        const newUser = {
            id: userId,
            username: null,
            createdAt: new Date().toISOString(),
            transaksi: 0,
            saldo: Number(amount) || 0
        };
        users.push(newUser);
    } else {
        users[userIndex].saldo = Number(users[userIndex].saldo || 0) + Number(amount || 0);
        users[userIndex].transaksi = Number(users[userIndex].transaksi || 0) + 1;
    }

    writeJsonFile(userDbPath, users);
    return true;
};

const formatDisplay = (amtStr) => {
    if (!amtStr || amtStr.length === 0) return '0';
    return Number(amtStr).toLocaleString('id-ID');
};

const buildKeyboard = () => ({
    inline_keyboard: [
        [{ text: ' ', icon_custom_emoji_id: emojiMap.n1, callback_data: 'deposit:digit:1', style: btn.blue }, { text: ' ', icon_custom_emoji_id: emojiMap.n2, callback_data: 'deposit:digit:2', style: btn.blue }, { text: ' ', icon_custom_emoji_id: emojiMap.n3, callback_data: 'deposit:digit:3', style: btn.blue }],
        [{ text: ' ', icon_custom_emoji_id: emojiMap.n4, callback_data: 'deposit:digit:4', style: btn.blue }, { text: ' ', icon_custom_emoji_id: emojiMap.n5, callback_data: 'deposit:digit:5', style: btn.blue }, { text: ' ', icon_custom_emoji_id: emojiMap.n6, callback_data: 'deposit:digit:6', style: btn.blue }],
        [{ text: ' ', icon_custom_emoji_id: emojiMap.n7, callback_data: 'deposit:digit:7', style: btn.blue }, { text: ' ', icon_custom_emoji_id: emojiMap.n8, callback_data: 'deposit:digit:8', style: btn.blue }, { text: ' ', icon_custom_emoji_id: emojiMap.n9, callback_data: 'deposit:digit:9', style: btn.blue }],
        [{ text: ' ', icon_custom_emoji_id: emojiMap.decline, callback_data: 'deposit:delete', style: btn.red }, { text: ' ', icon_custom_emoji_id: emojiMap.n0, callback_data: 'deposit:digit:0', style: btn.blue }, { text: ' ', icon_custom_emoji_id: emojiMap.accept, callback_data: 'deposit:ok', style: btn.green }],
        [{ text: 'Menu', icon_custom_emoji_id: emojiMap.homes, callback_data: 'home' }]
    ]
});

const ensureSession = (chatId) => {
    if (!sessions[chatId]) sessions[chatId] = { amount: '' };
    return sessions[chatId];
};

const clearSession = (chatId) => { delete sessions[chatId]; };

const clearDepositPoller = (chatId) => {
    if (activeDepositPolls[chatId]) {
        if (activeDepositPolls[chatId].intervalId) {
            clearInterval(activeDepositPolls[chatId].intervalId);
        }
        delete activeDepositPolls[chatId];
    }
};

const startDepositPolling = (ctx, reference, finalAmount, messageId, logger) => {
    const chatId = ctx.chat?.id || ctx.from?.id;
    if (!chatId) return;

    clearDepositPoller(chatId);

    let attempts = 0;
    const maxAttempts = 180; // 15 mins (180 * 5s)

    const intervalId = setInterval(async () => {
        attempts += 1;
        if (attempts > maxAttempts) {
            clearDepositPoller(chatId);
            try {
                await ctx.telegram.editMessageCaption(
                    chatId,
                    messageId,
                    undefined,
                    `❌ <b>Pembayaran Kadaluarsa</b>\n\nNominal: Rp ${finalAmount.toLocaleString('id-ID')}\nReference: ${reference}`,
                    { parse_mode: 'HTML' }
                );
            } catch (_) { }
            return;
        }

        try {
            const result = await checkPayment(reference, finalAmount);
            if (result && result.success) {
                clearDepositPoller(chatId);
                addUserBalance(chatId, finalAmount);

                try {
                    if (logger) logger.info(`Deposit success ${reference}`, 'deposit');
                    await sendDepositReceipt(ctx, {
                        depositId: reference,
                        amount: finalAmount,
                        method: 'qris',
                        user: ctx.from,
                        status: 'success'
                    });
                } catch (receiptError) {
                    if (logger) logger.error(String(receiptError), 'deposit_receipt');
                }

                try {
                    await ctx.telegram.deleteMessage(chatId, messageId);
                } catch (_) { }

                const msgText = buildEmojiHtml(`┌${Emoji.althardev} <b>${config.bot.shopName}</b>\n└─────────\n\n${Emoji.check} <b>Pembayaran Sukses</b>\n\nBerhasil ditambahkan ke saldo Anda sebesar Rp ${finalAmount.toLocaleString('id-ID')}.`);
                try {
                    await ctx.telegram.sendMessage(chatId, msgText, {
                        parse_mode: 'HTML',
                        ...Markup.inlineKeyboard([
                            [{ text: 'Menu', callback_data: 'home', style: btn.green }]
                        ])
                    });
                } catch (_) { }
            }
        } catch (err) {
            // ignore temporary polling errors
        }
    }, 5000);

    activeDepositPolls[chatId] = {
        intervalId,
        reference,
        messageId
    };
};

const showDepositPrompt = async (ctx, introText = null) => {
    const chatId = ctx.from && ctx.from.id;
    if (!chatId) return null;

    clearDepositPoller(chatId);
    const session = ensureSession(chatId);
    session.amount = '';

    const text = introText
        ? `${introText}\n\nSilahkan input nominal pengisian\n\n${formatDisplay(session.amount)}`
        : `Silahkan input nominal pengisian\n\n${formatDisplay(session.amount)}`;

    try {
        try { await ctx.sendChatAction('typing'); } catch (_) { }
        return await ctx.editMessageText(text, { reply_markup: buildKeyboard() });
    } catch (e) {
        try {
            try { await ctx.sendChatAction('typing'); } catch (_) { }
            return await ctx.reply(text, { reply_markup: buildKeyboard() });
        } catch (_) { }
    }

    return null;
};

const depositHandler = async (ctx, logger) => {
    const data = (ctx.callbackQuery && ctx.callbackQuery.data) || '';
    const chatId = ctx.from && ctx.from.id;
    try { if (logger) logger.callback('deposit', 'callback', ctx.from && (ctx.from.username || ctx.from.first_name)); } catch (_) { }
    try { await ctx.sendChatAction('typing'); } catch (_) { }
    if (!chatId) return;
    if (data === 'deposit') {
        return showDepositPrompt(ctx);
    }

    if (data.startsWith('deposit:')) {
        const parts = data.split(':');
        const action = parts[1];
        const session = ensureSession(chatId);

        if (action === 'digit') {
            const d = parts[2] || '';
            if (session.amount === '' && d === '0') {
                session.amount = '0';
            } else if (session.amount === '0') {
                session.amount = d;
            } else {
                if ((session.amount.length + 1) <= 12) session.amount = session.amount + d;
            }
            const text = `Silahkan input nominal pengisian\n\n${formatDisplay(session.amount)}`;
            try {
                return ctx.editMessageText(text, { reply_markup: buildKeyboard() });
            } catch (e) {
                try { await ctx.reply(text, { reply_markup: buildKeyboard() }); } catch (_) { }
            }
        }

        if (action === 'delete') {
            if (!session.amount || session.amount.length <= 1) session.amount = '';
            else session.amount = session.amount.slice(0, -1);
            const text = `Silahkan input nominal pengisian\n\n${formatDisplay(session.amount)}`;
            try {
                return ctx.editMessageText(text, { reply_markup: buildKeyboard() });
            } catch (e) {
                try { await ctx.reply(text, { reply_markup: buildKeyboard() }); } catch (_) { }
            }
        }

        if (action === 'cancel') {
            clearDepositPoller(chatId);
            try { await ctx.answerCbQuery('Deposit dibatalkan'); } catch (_) { }
            try { await ctx.deleteMessage(); } catch (_) { }
            const keyboard = Markup.inlineKeyboard([
                [{ text: 'Deposit Lagi', callback_data: 'deposit', style: btn.blue }],
                [{ text: 'Menu', callback_data: 'home', style: btn.green }]
            ]);
            return ctx.reply('Pengisian deposit telah dibatalkan.', keyboard);
        }

        if (action === 'check') {
            const reference = parts[2] || '';
            const amountValue = parts[3] || '';
            if (!reference || !amountValue || Number(amountValue) <= 0) {
                try { await ctx.answerCbQuery('Data tidak valid', { show_alert: true }); } catch (_) { }
                return;
            }
            try {
                if (logger) logger.callback('deposit:check', 'callback', ctx.from && (ctx.from.username || ctx.from.first_name));
                const result = await checkPayment(reference, Number(amountValue));
                if (result.success) {
                    clearDepositPoller(chatId);
                    addUserBalance(chatId, Number(amountValue));
                    try {
                        if (logger) logger.info(`Deposit success ${reference}`, 'deposit');
                        await sendDepositReceipt(ctx, {
                            depositId: reference,
                            amount: Number(amountValue),
                            method: 'qris',
                            user: ctx.from,
                            status: 'success'
                        });
                    } catch (receiptError) {
                        if (logger) logger.error(String(receiptError), 'deposit_receipt');
                    }
                    try { await ctx.deleteMessage(); } catch (_) { }
                    try { await ctx.answerCbQuery('Pembayaran berhasil', { show_alert: false }); } catch (_) { }
                    const msgText = buildEmojiHtml(`┌${Emoji.althardev} <b>${config.bot.shopName}</b>\n└─────────\n\n${Emoji.check} Pembayaran Sukses\n\nBerhasil ditambahkan ke saldo Anda.`);
                    try {
                        await ctx.reply(msgText, {
                            parse_mode: 'HTML',
                            ...Markup.inlineKeyboard([
                                [{ text: 'Menu', callback_data: 'home', style: btn.green }]
                            ])
                        });
                    } catch (_) { }

                    return;

                }

                const statusText = `❌ GAGAL\n${result.message}`;
                try { await ctx.answerCbQuery('Cek status pembayaran...'); } catch (_) { }
                return ctx.reply(`${statusText}\n\nNominal: Rp ${Number(amountValue).toLocaleString('id-ID')}\nReference: ${reference}`);
            } catch (err) {
                console.error('checkPayment error', err);
                try { await ctx.answerCbQuery('Terjadi kesalahan saat cek status.'); } catch (_) { }
                return ctx.reply('Terjadi kesalahan saat cek status pembayaran.');
            }
        }

        if (action === 'ok') {
            const base = session.amount || '';
            if (!base || Number(base) <= 0) {
                try { await ctx.answerCbQuery('Masukkan nominal terlebih dahulu', { show_alert: true }); } catch (_) { }
                return;
            }

            try {
                if (logger) logger.callback('deposit:ok', 'callback', ctx.from && (ctx.from.username || ctx.from.first_name));
                try { await ctx.deleteMessage(); } catch (_) { }

                const tmpDir = path.join(__dirname, '..', '..', 'database', 'qris');
                if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
                const outPath = path.join(tmpDir, `qris_${chatId}_${Date.now()}.png`);
                const { finalAmount, randomFee, reference } = await qrisDinamisWithFee(Number(base), outPath, logger);
                if (logger) logger.info(`Generated QR ${reference} amount=${finalAmount}`, 'deposit');

                const keyboard = Markup.inlineKeyboard([
                    [{ text: '❌ Batal', callback_data: `deposit:cancel:${reference}`, style: btn.red }]
                ]);

                const sentMsg = await ctx.replyWithPhoto({ source: outPath }, {
                    caption: `<b>QRIS Deposit</b>\n\nNominal: Rp ${finalAmount.toLocaleString('id-ID')}\nReference: ${reference}\n\n<em>Menunggu pembayaran (sistem akan otomatis mendeteksi)...</em>`,
                    ...keyboard,
                    parse_mode: 'HTML'
                });

                try { fs.unlinkSync(outPath); } catch (_) { }
                clearSession(chatId);

                startDepositPolling(ctx, reference, finalAmount, sentMsg.message_id, logger);
                return;
            } catch (err) {
                if (logger) logger.error(String(err), 'deposit_qr');
                try { await ctx.answerCbQuery('Gagal generate QR.'); } catch (_) { }
                return;
            }
        }
    }
    try { return ctx.answerCbQuery(); } catch (_) { return null; }
};

module.exports = (bot, logger) => {
    try {
        bot.action('deposit', async (ctx) => depositHandler(ctx, logger));
        bot.action(/deposit:.+/, async (ctx) => depositHandler(ctx, logger));
        bot.hears('💰 Deposit', async (ctx) => depositHandler(ctx, logger));
    } catch (e) {
        console.error('Failed to register deposit actions', e);
    }
};
