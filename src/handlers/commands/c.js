const { emojiMap, placeholderMap } = require('../../events/emojiMap');

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function extractCustomEmojiEntities(messageObj) {
  if (!messageObj) return [];
  const text = messageObj.text || messageObj.caption || '';
  const entities = messageObj.entities || messageObj.caption_entities || [];
  const list = [];

  for (const entity of entities) {
    if (entity.type === 'custom_emoji' && entity.custom_emoji_id) {
      const id = String(entity.custom_emoji_id);
      const emojiChar = text.substring(entity.offset, entity.offset + entity.length) || '✨';
      list.push({ id, emoji: emojiChar });
    }
  }
  return list;
}

function extractMappedEmojis(text) {
  if (!text) return [];
  const cleanText = text.replace(/^\/c(?:@\w+)?\s*/i, '').trim();
  if (!cleanText) return [];

  const list = [];

  if (placeholderMap && emojiMap) {
    for (const [key, placeholder] of Object.entries(placeholderMap)) {
      const id = emojiMap[key];
      if (id && cleanText.includes(placeholder)) {
        list.push({ id: String(id), emoji: placeholder });
      }
    }
  }

  const tokens = cleanText.split(/\s+/);
  for (const token of tokens) {
    const key = token.toLowerCase();
    if (emojiMap && emojiMap[key]) {
      const placeholder = (placeholderMap && placeholderMap[key]) || '✨';
      list.push({ id: String(emojiMap[key]), emoji: placeholder });
    } else if (/^\d{15,22}$/.test(token)) {
      list.push({ id: token, emoji: '✨' });
    }
  }

  return list;
}

const handleCustomEmojiCommand = async (ctx, logger) => {
  try {
    const msg = ctx.message;
    if (!msg) return;

    let extracted = extractCustomEmojiEntities(msg);

    if (msg.reply_to_message) {
      const replyExtracted = extractCustomEmojiEntities(msg.reply_to_message);
      extracted = extracted.concat(replyExtracted);
    }

    if (extracted.length === 0) {
      const textFromMsg = msg.text || msg.caption || '';
      const mappedFromMsg = extractMappedEmojis(textFromMsg);
      extracted = extracted.concat(mappedFromMsg);

      if (msg.reply_to_message) {
        const textFromReply = msg.reply_to_message.text || msg.reply_to_message.caption || '';
        const mappedFromReply = extractMappedEmojis(textFromReply);
        extracted = extracted.concat(mappedFromReply);
      }
    }

    const uniqueCustomEmojis = [];
    const seenIds = new Set();
    for (const item of extracted) {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        uniqueCustomEmojis.push(item);
      }
    }

    const replyOptions = {
      reply_to_message_id: msg.message_id
    };

    if (uniqueCustomEmojis.length === 0) {
      const notFoundMessage = 
        `❌ <b>Custom emoji tidak ditemukan.</b>\n\n` +
        `📌 <b>Cara Penggunaan:</b>\n` +
        `1. Kirim <code>/c &lt;custom_emoji&gt;</code> (bisa lebih dari 1 emoji)\n` +
        `2. Atau reply pesan yang berisi custom emoji dengan <code>/c</code>`;

      return await ctx.reply(notFoundMessage, {
        ...replyOptions,
        parse_mode: 'HTML'
      });
    }

    const titleHeader = uniqueCustomEmojis.length === 1
      ? `<b>✨ ID Custom Emoji:</b>\n\n`
      : `<b>✨ ID Custom Emoji (${uniqueCustomEmojis.length}):</b>\n\n`;

    const listLines = uniqueCustomEmojis.map((item) => {
      const safeEmoji = escapeHtml(item.emoji);
      return `• <tg-emoji emoji-id="${item.id}">${safeEmoji}</tg-emoji> : <code>${item.id}</code>`;
    }).join('\n');

    const htmlContent = titleHeader + listLines;

    try {
      await ctx.reply(htmlContent, {
        ...replyOptions,
        parse_mode: 'HTML'
      });
    } catch (e) {
      const plainText = titleHeader.replace(/<[^>]+>/g, '') + uniqueCustomEmojis.map(item => `${item.emoji} : ${item.id}`).join('\n');
      await ctx.reply(plainText, replyOptions);
    }

    if (logger && logger.command) {
      logger.command('c', 'from', ctx.from?.username || ctx.from?.first_name || String(ctx.from?.id));
    }
  } catch (error) {
    console.error('Error in custom emoji command handler:', error);
    try {
      await ctx.reply('❌ Terjadi kesalahan saat memproses custom emoji.', {
        reply_to_message_id: ctx.message?.message_id
      });
    } catch (_) {}
  }
};

module.exports = (bot, logger) => {
  bot.command('c', async (ctx) => {
    await handleCustomEmojiCommand(ctx, logger);
  });
};
