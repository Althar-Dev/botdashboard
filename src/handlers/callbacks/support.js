const path = require('path');
const fs = require('fs');
const { Markup } = require('telegraf');
const { startAction } = require('../commands/start');
const config = require('../../database/config.json');
const btn = require('../../events/style');
const { Emoji, emojiMap, buildEmojiEntities } = require('../../events/emojiMap');

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

const formatAdminContacts = () => {
  const adminIds = (config && config.bot && Array.isArray(config.bot.adminId)) ? config.bot.adminId : [];
  if (adminIds.length === 0) {
    return 'Admin belum dikonfigurasi.';
  }

  const contacts = adminIds.map((id) => {
    const adminUser = getUserById(id);
    return adminUser && adminUser.username ? `@${adminUser.username}` : String(id);
  });

  return `Admin: ${contacts.join(', ')}${Emoji.verified}`;
};

module.exports = (bot, logger) => {
  bot.action('support', async (ctx) => {
    try {
      if (logger) logger.callback('support', 'callback', ctx.from && (ctx.from.username || ctx.from.first_name));
    } catch (_) {}
    try { await ctx.sendChatAction('typing'); } catch (_) {}

    const supportContact = formatAdminContacts();

    const text = `${Emoji.shield} Support\n\nJika Anda memerlukan bantuan, silakan hubungi admin atau gunakan menu di bawah.\n\n${supportContact}\n\nPanduan: \n- /start untuk ulang tampilan awal\n- Deposit untuk isi saldo\n- Profil untuk info akun`;
    const entities = buildEmojiEntities(text);
    const keyboard = Markup.inlineKeyboard([
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

  bot.hears('🆘 Bantuan', async (ctx) => {
    try {
      if (logger) logger.callback('support', 'hears', ctx.from && (ctx.from.username || ctx.from.first_name));
    } catch (_) {}
    try { await ctx.sendChatAction('typing'); } catch (_) {}

    const supportContact = formatAdminContacts();

    const text = `${Emoji.shield} Support\n\nJika Anda memerlukan bantuan, silakan hubungi admin atau gunakan menu di bawah.\n\n${supportContact}\n\nPanduan: \n- /start untuk ulang tampilan awal\n- Deposit untuk isi saldo\n- Profil untuk info akun`;
    const entities = buildEmojiEntities(text);
    const keyboard = Markup.inlineKeyboard([
      [{ text: 'Menu', icon_custom_emoji_id: emojiMap.homes, callback_data: 'home', style: btn.green }]
    ]);

    await ctx.reply(text, {
      entities,
      ...keyboard
    });
  });
};
