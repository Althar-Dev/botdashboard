const path = require('path');
const fs = require('fs');
const { Markup } = require('telegraf');
const { Emoji, buildEmojiHtml, emojiMap } = require('../../events/emojiMap');
const config = require('../../database/config.json');
const btn = require('../../events/style');

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

const getUserById = (userId) => {
  const users = readJsonFile(userDbPath, []);
  if (!Array.isArray(users)) return null;
  return users.find((user) => String(user.id) === String(userId)) || null;
};

module.exports = (bot, logger) => {
  bot.action('history', async (ctx) => {
    try { if (logger) logger.callback && logger.callback('history', 'callback', ctx.from && (ctx.from.username || ctx.from.first_name)); } catch (_) {}
    try { await ctx.sendChatAction('typing'); } catch (_) {}

    const userId = ctx.from?.id;
    if (!userId) {
      try { await ctx.answerCbQuery('Data pengguna tidak tersedia', { show_alert: true }); } catch (_) {}
      return;
    }

    const user = getUserById(userId);
    if (!user) {
      try { await ctx.answerCbQuery('Anda belum terdaftar. Silakan mulai ulang bot.', { show_alert: true }); } catch (_) {}
      return;
    }

    const orders = Array.isArray(user.order) ? user.order.slice().reverse() : [];
    if (orders.length === 0) {
      try { await ctx.answerCbQuery('Anda belum memiliki riwayat transaksi.', { show_alert: true }); } catch (_) {}
      return;
    }

    const rows = orders.slice(0, 20).map((o) => [{ text: `${o.id}`, callback_data: `history:order:${o.id}` }]);
    rows.push([
      { text: 'Back', icon_custom_emoji_id: emojiMap.backs, callback_data: 'profil', style: btn.red },
      { text: 'Menu', icon_custom_emoji_id: emojiMap.homes, callback_data: 'home', style: btn.green }
    ]);

    const msgText = buildEmojiHtml(`${Emoji.book} <b>Riwayat Order</b>\n\nPilih Order ID untuk melihat detail`);
    try {
      return await ctx.editMessageText(msgText, { reply_markup: Markup.inlineKeyboard(rows).reply_markup, parse_mode: 'HTML' });
    } catch (err) {
      return await ctx.reply(msgText, { reply_markup: Markup.inlineKeyboard(rows).reply_markup, parse_mode: 'HTML' });
    }
  });

  bot.action(/history:order:(.+)/, async (ctx) => {
    try { if (logger) logger.callback && logger.callback('history:order', 'callback', ctx.from && (ctx.from.username || ctx.from.first_name)); } catch (_) {}
    try { await ctx.sendChatAction('typing'); } catch (_) {}

    const match = ctx.match;
    const orderId = match && match[1];
    const userId = ctx.from?.id;
    if (!orderId || !userId) {
      try { await ctx.answerCbQuery('Data tidak tersedia', { show_alert: true }); } catch (_) {}
      return;
    }

    const user = getUserById(userId);
    if (!user) {
      try { await ctx.answerCbQuery('Anda belum terdaftar. Silakan mulai ulang bot.', { show_alert: true }); } catch (_) {}
      return;
    }

    const order = Array.isArray(user.order) ? user.order.find((o) => String(o.id) === String(orderId)) : null;
    if (!order) {
      try { await ctx.answerCbQuery('Order tidak ditemukan.', { show_alert: true }); } catch (_) {}
      return;
    }

    const date = order.date ? new Date(order.date).toLocaleString('id-ID') : '-';
    const methodEmoji = order.method === 'qris' ? Emoji.qris1 : order.method === 'saldo' ? Emoji.wallet : '';
    const detail = `${Emoji.pin} <b>Order</b> <em>[#${order.id}]</em>\n\n╭─────────────────────╮\n├ Produk: ${order.product}\n├ Harga: Rp ${Number(order.price || 0).toLocaleString('id-ID')}\n├ Metode: ${methodEmoji}${order.reference ? `\n├ Reference: ${order.reference}` : ''}\n├ Status: ${order.status}\n╰─────────────────────╯\n\n<blockquote>Tanggal: ${date}</blockquote>`;
    const html = buildEmojiHtml(detail);
    const keyboard = Markup.inlineKeyboard([
      [{ text: 'Back', icon_custom_emoji_id: emojiMap.backs, callback_data: 'history', style: btn.red }],
      [{ text: 'Menu', icon_custom_emoji_id: emojiMap.homes, callback_data: 'home', style: btn.green }]
    ]);

    try {
      return await ctx.editMessageText(html, { reply_markup: keyboard.reply_markup, parse_mode: 'HTML' });
    } catch (err) {
      return await ctx.reply(html, { reply_markup: keyboard.reply_markup, parse_mode: 'HTML' });
    }
  });
};
