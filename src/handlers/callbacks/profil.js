const path = require('path');
const fs = require('fs');
const { Markup } = require('telegraf');
const { startAction } = require('../commands/start');
const config = require('../../database/config.json');
const { Emoji, emojiMap, buildEmojiEntities } = require('../../events/emojiMap');
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
  return users.find((user) => user.id === userId) || null;
};

const formatCurrency = (value) => {
  const amount = Number(value || 0);
  return Number.isFinite(amount) ? amount.toLocaleString('id-ID') : '0';
};

const formatProfileText = (user = {}, ctx) => {
  const username = user.username ? `@${user.username}` : (ctx.from?.first_name || 'Unknown');
  const msgText = `${Emoji.users} Profil ${user.username}${Emoji.verified}\n\n╭─────────────────────╮\n├ ${Emoji.user} ID : ${user.id || '-'}\n├ ${Emoji.user1} Username : ${username}\n├ ${Emoji.blnce} Saldo : Rp ${formatCurrency(user.saldo)}\n├ ${Emoji.cart2} Transaksi : ${Number(user.transaksi || 0).toLocaleString('id-ID')}\n╰─────────────────────╯\n\nTekan Riwayat untuk melihat riwayat transaksi anda atau Menu untuk kembali.`;
  const entities = buildEmojiEntities(msgText);
  return {
    text: msgText,
    entities
  };
};

module.exports = (bot, logger) => {
  bot.action('profil', async (ctx) => {
    try {
      if (logger) logger.callback('profil', 'callback', ctx.from && (ctx.from.username || ctx.from.first_name));
    } catch (_) { }
    try { await ctx.sendChatAction('typing'); } catch (_) { }

    const userId = ctx.from?.id;
    if (!userId) {
      try { await ctx.answerCbQuery('Data pengguna tidak tersedia', { show_alert: true }); } catch (_) { }
      return;
    }

    const user = getUserById(userId);
    if (!user) {
      try { await ctx.answerCbQuery('Anda belum terdaftar. Silakan mulai ulang bot.', { show_alert: true }); } catch (_) { }
      return startAction(ctx, logger);
    }

    const { text, entities } = formatProfileText(user, ctx);
    const keyboard = Markup.inlineKeyboard([
      [{ text: 'Riwayat', icon_custom_emoji_id: emojiMap.ref, callback_data: 'history', style: btn.blue }],
      [{ text: 'Menu', icon_custom_emoji_id: emojiMap.homes, callback_data: 'home', style: btn.green }]
    ]);

    try {
      await ctx.editMessageText(text, {
        entities,
        ...keyboard
      });
    } catch (err) {
      await ctx.reply(text, {
        entities,
        ...keyboard
      });
    }
  });

  bot.hears('👤 Profil', async (ctx) => {
    try {
      if (logger) logger.callback('profil', 'hears', ctx.from && (ctx.from.username || ctx.from.first_name));
    } catch (_) { }
    try { await ctx.sendChatAction('typing'); } catch (_) { }

    const userId = ctx.from?.id;
    if (!userId) {
      return ctx.reply('Data pengguna tidak tersedia.');
    }

    const user = getUserById(userId);
    if (!user) {
      return ctx.reply('Anda belum terdaftar. Silakan mulai ulang bot.');
    }

    const { text, entities } = formatProfileText(user, ctx);
    const keyboard = Markup.inlineKeyboard([
      [{ text: 'Riwayat', callback_data: 'history', style: btn.blue }],
      [{ text: 'Menu', callback_data: 'home', style: btn.green }]
    ]);

    await ctx.reply(text, {
      entities,
      ...keyboard
    });
  });
};
