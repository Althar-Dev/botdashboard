const config = require('../database/config.json');
const emojiMapDb = require('../database/emojiMap.json');
const { buildEmojiHtml, Emoji } = require('./emojiMap');

const formatCurrency = (value) => {
    const number = Number(value || 0);
    return Number.isFinite(number) ? number.toLocaleString('id-ID') : '0';
};

const sendToAdmins = async (ctx, textHtml, opts = {}) => {
    try {
        const channel = config.bot?.channel;
        const rawAdminIds = Array.isArray(config.bot?.adminId) ? config.bot.adminId : [config.bot?.adminId].filter(Boolean);
        const adminIds = Array.from(new Set(rawAdminIds.filter(Boolean).map((v) => String(v))));
        if (!adminIds || adminIds.length === 0) return;

        let forwarded = false;
        for (const idStr of adminIds) {
            const id = /^\d+$/.test(idStr) ? Number(idStr) : idStr;
            try {
                if (ctx && ctx.telegram) {
                    const sent = await ctx.telegram.sendMessage(id, textHtml, { parse_mode: 'HTML', ...opts });
                    if (!forwarded && channel) {
                        try {
                            await ctx.telegram.forwardMessage(channel, id, sent.message_id);
                            forwarded = true;
                        } catch (err) {
                            console.error('Forward to channel failed:', String(err));
                        }
                    }
                }
            } catch (err) {
                console.error('Send to admin failed:', String(err));
            }
        }
    } catch (err) {
        console.error('sendToAdmins error:', String(err));
    }
};

const sendPurchaseReceipt = async (ctx, payload = {}) => {
    try {
        const { orderId, user, username, serviceName, serviceIcon, price, status = 'success', phone = '-', method = '' } = payload;
        const userLabel = username || (user && (user.username || `${user.first_name || ''} ${user.last_name || ''}`)) || '-';
        const time = new Date().toLocaleString('id-ID');

        const methodKey = (method || phone || '').toString().toLowerCase();
        const methodEmoji = methodKey === 'qris' ? Emoji.qris1 : methodKey === 'saldo' ? Emoji.wallet : Emoji.loader;

        const normalizedIconKey = typeof serviceIcon === 'string' ? serviceIcon.trim().toLowerCase() : '';
        const iconConfig = normalizedIconKey && emojiMapDb[normalizedIconKey]
            ? emojiMapDb[normalizedIconKey]
            : emojiMapDb.default;
        const serviceIconId = iconConfig && typeof iconConfig === 'object' ? iconConfig.id : (typeof iconConfig === 'string' ? iconConfig : null);
        const placeholder = iconConfig && typeof iconConfig === 'object' && iconConfig.placeholder
            ? iconConfig.placeholder
            : (typeof iconConfig === 'string' ? '📦' : '📦');
        const productIconHtml = serviceIconId
            ? `<tg-emoji emoji-id="${serviceIconId}">${placeholder}</tg-emoji>`
            : placeholder;

        let tpl = `┌${Emoji.althardev} <b>${config.bot.shopName}</b>\n└──${Emoji.ref} <strong>Invoice Order</strong>\n\n<em>Ref: #${orderId}</em>\n`;
        tpl += `<blockquote>╭─────────────────────╮\n`;
        tpl += `├ ${Emoji.user}<b>User:</b> ${userLabel}\n`;
        tpl += `├ ${Emoji.cart}<b>Product:</b> ${productIconHtml} ${serviceName || '-'}\n`;
        tpl += `├ ${Emoji.money}<b>Harga:</b> Rp ${formatCurrency(price)}\n`;
        tpl += `├ ${Emoji.loader}<b>Status:</b> ${status} ${Emoji.check}\n`;
        tpl += `├ ${Emoji.user2}<b>Method:</b> ${methodEmoji}\n╰─────────────────────╯</blockquote>\n\n<em>Terimakasih telah berbelanja.</em>`;

        const html = buildEmojiHtml(tpl);
        const adminIds = Array.isArray(config.bot?.adminId) ? config.bot.adminId.map((v) => String(v)) : [String(config.bot?.adminId)].filter(Boolean);
        const currentChatId = ctx && ctx.chat && ctx.chat.id ? String(ctx.chat.id) : null;

        await sendToAdmins(ctx, html);
        try {
            if (ctx && ctx.chat && ctx.chat.id && !adminIds.includes(currentChatId)) {
                await ctx.reply(html, { parse_mode: 'HTML' });
            }
        } catch (_) { }
    } catch (err) {
        try { if (ctx && ctx.logger) ctx.logger.error && ctx.logger.error(String(err), 'receipt'); } catch (_) { }
    }
};

const sendDepositReceipt = async (ctx, payload = {}) => {
    try {
        const { depositId, user, username, amount, method = '-', status = 'pending' } = payload;
        const userLabel = username || (user && (user.username || `${user.first_name || ''} ${user.last_name || ''}`)) || '-';
        const time = new Date().toLocaleString('id-ID');

        const methodKey = (method || '').toString().toLowerCase();
        const methodEmoji = methodKey === 'qris' ? Emoji.qris1 : methodKey === 'saldo' ? Emoji.wallet : Emoji.bill;

        let tpl = `┌${Emoji.althardev} <b>${config.bot.shopName}</b>\n└──${Emoji.bill} <strong>Invoice Deposit</strong>\n\n<em>Ref: #${depositId || '-'}</em>\n`;
        tpl += `<blockquote>╭─────────────────────╮\n├ <b>Deposit ID:</b> ${depositId || '-'}\n`;
        tpl += `├ ${Emoji.user}<b>User:</b> ${userLabel}\n`;
        tpl += `├ ${Emoji.money}<b>Nominal:</b> Rp ${formatCurrency(amount)}\n`;
        tpl += `├ ${Emoji.user2}<b>Metode:</b> ${Emoji.qris1}\n`;
        tpl += `├ ${Emoji.loader}<b>Status:</b> ${status} ${Emoji.check}\n╰─────────────────────╯</blockquote>\n\n<em>Terimakasih telah melakukan deposit.</em>`;

        const html = buildEmojiHtml(tpl);
        const adminIds = Array.isArray(config.bot?.adminId) ? config.bot.adminId.map((v) => String(v)) : [String(config.bot?.adminId)].filter(Boolean);
        const currentChatId = ctx && ctx.chat && ctx.chat.id ? String(ctx.chat.id) : null;

        await sendToAdmins(ctx, html);
        try {
            if (ctx && ctx.chat && ctx.chat.id && !adminIds.includes(currentChatId)) {
                await ctx.reply(html, { parse_mode: 'HTML' });
            }
        } catch (_) { }
    } catch (err) {
        try { if (ctx && ctx.logger) ctx.logger.error && ctx.logger.error(String(err), 'receipt'); } catch (_) { }
    }
};

module.exports = {
    sendPurchaseReceipt,
    sendDepositReceipt
};
