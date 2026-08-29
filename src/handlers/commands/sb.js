const fs = require('fs');
const path = require('path');
const { Markup } = require('telegraf');
const { Emoji, buildEmojiEntities } = require('../../events/emojiMap');
const config = require('../../database/config.json');
const userDbPath = path.join(__dirname, '..', '..', 'database', 'user.json');

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

const getRecipients = () => {
    const users = readJsonFile(userDbPath, []);
    if (!Array.isArray(users)) return [];

    return users
        .map((user) => user && user.id)
        .filter((id) => id !== undefined && id !== null && id !== '' && Number(id) !== Number(config?.bot?.adminId))
        .map((id) => String(id));
};

const parseBroadcastInput = (rawText = '') => {
    const text = String(rawText || '').trim();
    if (!text) return { text: '', buttonText: '', buttonUrl: '' };

    const parts = text
        .split('|')
        .map((part) => part.trim())
        .filter((part) => part !== '');

    if (parts.length >= 3) {
        return {
            text: parts[0] || '',
            buttonText: parts[1] || '',
            buttonUrl: parts[2] || ''
        };
    }

    return { text, buttonText: '', buttonUrl: '' };
};

const buildKeyboard = (buttonText, buttonUrl) => {
    if (!buttonText || !buttonUrl) return null;
    return Markup.inlineKeyboard([[Markup.button.url(buttonText, buttonUrl)]]);
};

const buildBroadcastText = (text) => {
    const cleanText = String(text || '').trim();
    const header = `${Emoji.sb} Broadcast`;
    const fullText = cleanText ? `${header}\n\n${cleanText}` : header;
    const entities = buildEmojiEntities(fullText);
    return { text: fullText, entities };
};

const sendToRecipients = async (ctx, recipients, payload) => {
    const results = [];

    for (const recipientId of recipients) {
        try {
            if (payload.isPhoto) {
                if (payload.type === 'document') {
                    await ctx.telegram.sendDocument(recipientId, payload.fileId, payload.options);
                } else {
                    await ctx.telegram.sendPhoto(recipientId, payload.fileId, payload.options);
                }
            } else {
                await ctx.telegram.sendMessage(recipientId, payload.text, payload.options);
            }
            results.push({ recipientId, ok: true });
        } catch (error) {
            console.error(`Error sending to ${recipientId}:`, error);
            results.push({ recipientId, ok: false, error });
        }
    }

    return results;
};

const sbCommand = async (ctx, logger) => {
    try {
        const fromId = ctx.from?.id;
        const adminId = config?.bot?.adminId;

        if (String(fromId) !== String(adminId)) {
            return ctx.reply('❌ Hanya admin yang bisa memakai perintah ini.');
        }

        const messageText = ctx.message?.text || ctx.message?.caption || '';
        const isChannelTarget = /\/sb\s+ch/i.test(messageText);
        const rawText = messageText.replace(/^\/sb(?:\s+ch)?\s*/i, '').trim();

        const photo = ctx.message?.photo?.length ? ctx.message.photo[ctx.message.photo.length - 1] : null;
        const document = ctx.message?.document || null;

        if (!rawText && !photo && !document) {
            return ctx.reply('Format: /sb <teks> | <tombol> | <link_tombol>\nContoh: /sb Halo semua | Join | https://t.me/namachannel\n\n/sb ch <teks> | <tombol> | <link_tombol> untuk kirim ke channel');
        }

        const { text, buttonText, buttonUrl } = parseBroadcastInput(rawText);

        let messageContent = text;
        let messageEntities = [];
        
        if (text) {
            const broadcastPayload = buildBroadcastText(text);
            messageContent = broadcastPayload.text;
            messageEntities = broadcastPayload.entities;
        }

        const replyMarkup = buildKeyboard(buttonText, buttonUrl);
        
        const commonOptions = {};
        if (replyMarkup && replyMarkup.reply_markup) {
            commonOptions.reply_markup = replyMarkup.reply_markup;
        }

        const recipients = isChannelTarget
            ? [config?.bot?.channel].filter(Boolean)
            : getRecipients();

        if (!recipients.length) {
            return ctx.reply('Tidak ada recipient yang tersedia untuk di-broadcast.');
        }

        try {
            let results = [];

            if (photo) {
                results = await sendToRecipients(ctx, recipients, {
                    isPhoto: true,
                    type: 'photo',
                    fileId: photo.file_id,
                    options: {
                        caption: messageContent || undefined,
                        caption_entities: messageEntities.length > 0 ? messageEntities : undefined,
                        ...commonOptions
                    }
                });
            } else if (document && document.mime_type && document.mime_type.startsWith('image/')) {
                results = await sendToRecipients(ctx, recipients, {
                    isPhoto: true,
                    type: 'document',
                    fileId: document.file_id,
                    options: {
                        caption: messageContent || undefined,
                        caption_entities: messageEntities.length > 0 ? messageEntities : undefined,
                        ...commonOptions
                    }
                });
            } else {
                results = await sendToRecipients(ctx, recipients, {
                    isPhoto: false,
                    text: messageContent,
                    options: {
                        entities: messageEntities.length > 0 ? messageEntities : undefined,
                        ...commonOptions
                    }
                });
            }

            const successCount = results.filter((item) => item.ok).length;
            return ctx.reply(`✅ Broadcast selesai. Terkirim: ${successCount}/${recipients.length}`);
        } catch (error) {
            console.error('Broadcast send error:', error);
            return ctx.reply('❌ Gagal mengirim broadcast.');
        }
    } catch (error) {
        console.error('Broadcast command error:', error);
        try { if (logger) logger.command && logger.command('sb', 'error', String(error)); } catch(_) {}
        return ctx.reply('❌ Terjadi kesalahan pada perintah broadcast.');
    }
};

    module.exports = (bot, logger) => {
        bot.command('sb', async (ctx) => {
            try {
                await sbCommand(ctx, logger);
            } catch (err) {
                console.error('Error in sb command handler', err);
                try { await ctx.reply('❌ Terjadi kesalahan saat mengeksekusi perintah.'); } catch(_) {}
            }
        });
    };