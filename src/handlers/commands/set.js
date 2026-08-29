const fs = require('fs');
const path = require('path');
const { Markup } = require('telegraf');
const { emojiMap } = require('../../events/emojiMap');
const btn = require('../../events/style');

const configPath = path.join(__dirname, '..', '..', 'database', 'config.json');
const productDbPath = path.join(__dirname, '..', '..', 'database', 'product.json');
const emojiMapJsonPath = path.join(__dirname, '..', '..', 'database', 'emojiMap.json');

const readConfig = () => {
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (e) {
    return {};
  }
};

const writeConfig = (cfg) => {
  fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2), 'utf8');
};

const readJsonFile = (filePath, defaultValue) => {
  try {
    if (!fs.existsSync(filePath)) return defaultValue;
    const raw = fs.readFileSync(filePath, 'utf8').trim();
    return raw ? JSON.parse(raw) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

const writeJsonFile = (filePath, value) => {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8');
};

const PAGE_SIZE = 8;

const readEmojiMap = () => {
  const map = readJsonFile(emojiMapJsonPath, {});
  return typeof map === 'object' && map && !Array.isArray(map) ? map : {};
};

const getEmojiConfig = (emojiMapDb, key) => {
  const raw = emojiMapDb && emojiMapDb[key];
  if (!raw) return null;
  if (typeof raw === 'string') {
    return { id: raw, placeholder: key };
  }
  if (typeof raw === 'object') {
    return {
      id: raw.id || null,
      placeholder: raw.placeholder || key
    };
  }
  return null;
};

const buildIconSelectionKeyboard = (callbackBase, iconKeys, backCallback, page = 1) => {
  const emojiMapDb = readEmojiMap();
  const pageCount = Math.max(1, Math.ceil(iconKeys.length / PAGE_SIZE));
  const currentPage = Math.max(1, Math.min(page, pageCount));
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageKeys = iconKeys.slice(start, start + PAGE_SIZE);
  const rows = [];
  for (let i = 0; i < pageKeys.length; i += 6) {
    const rowKeys = pageKeys.slice(i, i + 6);
    rows.push(rowKeys.map((key) => {
      const iconConfig = getEmojiConfig(emojiMapDb, key);
      const iconId = iconConfig && iconConfig.id ? String(iconConfig.id) : undefined;
      const buttonText = iconConfig && iconConfig.placeholder ? String(iconConfig.placeholder) : key;
      return {
        text: ' ',
        ...(iconId ? { icon_custom_emoji_id: iconId } : {}),
        callback_data: `${callbackBase}:icon:${key}`,
        style: btn.blue
      };
    }));
  }
  const nav = [];
  if (currentPage > 1) nav.push({ text: 'Prev', callback_data: `${callbackBase}:page:${currentPage - 1}`, style: btn.red });
  if (currentPage < pageCount) nav.push({ text: 'Next', callback_data: `${callbackBase}:page:${currentPage + 1}`, style: btn.green });
  if (nav.length) rows.push(nav);
  rows.push([
    { text: 'Back', icon_custom_emoji_id: emojiMap.backs, callback_data: backCallback, style: btn.red },
    { text: 'Menu', icon_custom_emoji_id: emojiMap.homes, callback_data: 'home', style: btn.green }
  ]);
  return Markup.inlineKeyboard(rows);
};

const buildCategorySelectionKeyboard = (callbackPrefix, page = 1) => {
  const products = readJsonFile(productDbPath, []);
  if (!Array.isArray(products)) return null;
  const pageCount = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const currentPage = Math.max(1, Math.min(page, pageCount));
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = products.slice(start, start + PAGE_SIZE);
  const rows = [];
  for (let i = 0; i < pageItems.length; i += 2) {
    const rowItems = pageItems.slice(i, i + 2);
    rows.push(rowItems.map((category) => ({
      text: category.name || category.id,
      callback_data: `${callbackPrefix}:${category.id}`,
      style: btn.blue
    })));
  }
  const nav = [];
  if (currentPage > 1) nav.push({ text: 'Prev', callback_data: `${callbackPrefix}:page:${currentPage - 1}`, style: btn.red });
  if (currentPage < pageCount) nav.push({ text: 'Next', callback_data: `${callbackPrefix}:page:${currentPage + 1}`, style: btn.green });
  if (nav.length) rows.push(nav);
  rows.push([
    { text: 'Back', icon_custom_emoji_id: emojiMap.backs, callback_data: 'set:icon:menu', style: btn.red },
    { text: 'Menu', icon_custom_emoji_id: emojiMap.homes, callback_data: 'home', style: btn.green }
  ]);
  return Markup.inlineKeyboard(rows);
};

const sessions = {};

const clearSession = (chatId) => {
  if (chatId && sessions[chatId]) {
    delete sessions[chatId];
  }
};

const configPrompts = {
  'bot.channel': 'Kirim username channel (contoh @MyChannel).',
  'bot.shopName': 'Kirim nama toko.',
  'bot.btnCtr': 'Kirim jumlah kolom tombol untuk kategori.',
  'bot.btnPrd': 'Kirim jumlah kolom tombol untuk produk.',
  'svalepay.business_id': 'Kirim SValePay Business ID (contoh: SVP-XXXXX).',
  'svalepay.secret_key': 'Kirim SValePay Secret Key.',
  'gomerchant.apikey': 'Kirim SValePay Secret Key (legacy key: gomerchant.apikey).',
  'gomerchant.nama_project': 'Kirim SValePay Business ID (legacy key: gomerchant.nama_project).'
};

const buildSetMenuKeyboard = () => Markup.inlineKeyboard([
  [{ text: 'Set Category Icon', callback_data: 'set:icon:category', style: btn.blue }, { text: 'Set Product Icon', callback_data: 'set:icon:product', style: btn.blue }],
  [{ text: 'Set Shop Name', callback_data: 'set:config:bot.shopName', style: btn.blue }, { text: 'Set Channel', callback_data: 'set:config:bot.channel', style: btn.blue }],
  [{ text: 'Set Btn Cols', callback_data: 'set:config:bot.btnCtr', style: btn.blue }, { text: 'Set Product Btn Cols', callback_data: 'set:config:bot.btnPrd', style: btn.blue }],
  [{ text: 'Set SValePay Business ID', callback_data: 'set:config:svalepay.business_id', style: btn.blue }, { text: 'Set SValePay Secret Key', callback_data: 'set:config:svalepay.secret_key', style: btn.blue }],
  [{ text: 'Home', icon_custom_emoji_id: emojiMap.homes, callback_data: 'home', style: btn.green }]
]);

const sendSetMenu = async (ctx) => {
  const keyboard = buildSetMenuKeyboard();
  try {
    return await ctx.editMessageText('Pilih pengaturan yang ingin diubah menggunakan tombol di bawah ini.', keyboard);
  } catch (e) {
    return await ctx.reply('Pilih pengaturan yang ingin diubah menggunakan tombol di bawah ini.', keyboard);
  }
};

const buildProductSelectionKeyboard = (categoryId, page = 1) => {
  const products = readJsonFile(productDbPath, []);
  if (!Array.isArray(products)) return null;
  const category = products.find((c) => String(c.id) === String(categoryId));
  if (!category || !Array.isArray(category.items)) return null;
  const pageCount = Math.max(1, Math.ceil(category.items.length / PAGE_SIZE));
  const currentPage = Math.max(1, Math.min(page, pageCount));
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = category.items.slice(start, start + PAGE_SIZE);
  const rows = [];
  for (let i = 0; i < pageItems.length; i += 2) {
    const rowItems = pageItems.slice(i, i + 2);
    rows.push(rowItems.map((item) => ({
      text: item.name || item.id,
      callback_data: `set:icon:product:${categoryId}:${item.id}`,
      style: btn.blue
    })));
  }
  const nav = [];
  if (currentPage > 1) nav.push({ text: 'Prev', callback_data: `set:icon:product:${categoryId}:page:${currentPage - 1}`, style: btn.red });
  if (currentPage < pageCount) nav.push({ text: 'Next', callback_data: `set:icon:product:${categoryId}:page:${currentPage + 1}`, style: btn.green });
  if (nav.length) rows.push(nav);
  rows.push([
    { text: 'Back', icon_custom_emoji_id: emojiMap.backs, callback_data: 'set:icon:product', style: btn.red },
    { text: 'Menu', icon_custom_emoji_id: emojiMap.homes, callback_data: 'home', style: btn.green }
  ]);
  return Markup.inlineKeyboard(rows);
};

module.exports = (bot, logger) => {
  bot.command('set', async (ctx) => {
    const fromId = ctx.from && ctx.from.id;
    const cfg = readConfig();
    const admins = Array.isArray(cfg.bot?.adminId) ? cfg.bot.adminId.map(String) : [String(cfg.bot?.adminId)].filter(Boolean);
    if (!admins.includes(String(fromId))) {
      return ctx.reply('Hanya admin yang dapat mengubah konfigurasi.');
    }

    const keyboard = buildSetMenuKeyboard();
    return ctx.reply('Pilih pengaturan yang ingin diubah menggunakan tombol di bawah ini.', keyboard);
  });

  const isAdmin = (userId) => {
    const cfg = readConfig();
    const admins = Array.isArray(cfg.bot?.adminId) ? cfg.bot.adminId.map(String) : [String(cfg.bot?.adminId)].filter(Boolean);
    return admins.includes(String(userId));
  };

  bot.action('set:icon:category', async (ctx) => {
    if (!isAdmin(ctx.from?.id)) return ctx.answerCbQuery('Hanya admin yang dapat mengubah icon.');
    const keyboard = buildCategorySelectionKeyboard('set:icon:category');
    if (!keyboard) return ctx.answerCbQuery('Tidak ada kategori untuk dipilih.');
    try {
      await ctx.editMessageText('Pilih kategori yang ingin diubah icon-nya:', { ...keyboard });
    } catch (err) {
      await ctx.reply('Pilih kategori yang ingin diubah icon-nya:', keyboard);
    }
  });

  bot.action('set:icon:product', async (ctx) => {
    if (!isAdmin(ctx.from?.id)) return ctx.answerCbQuery('Hanya admin yang dapat mengubah icon.');
    const keyboard = buildCategorySelectionKeyboard('set:icon:product');
    if (!keyboard) return ctx.answerCbQuery('Tidak ada kategori untuk dipilih.');
    try {
      await ctx.editMessageText('Pilih kategori produk terlebih dahulu:', { ...keyboard });
    } catch (err) {
      await ctx.reply('Pilih kategori produk terlebih dahulu:', keyboard);
    }
  });

  bot.action(/set:icon:category:page:(\d+)/, async (ctx) => {
    if (!isAdmin(ctx.from?.id)) return ctx.answerCbQuery('Hanya admin yang dapat mengubah icon.');
    const page = Number(ctx.match[1]);
    const keyboard = buildCategorySelectionKeyboard('set:icon:category', page);
    if (!keyboard) return ctx.answerCbQuery('Tidak ada kategori untuk dipilih.');
    try {
      await ctx.editMessageText('Pilih kategori yang ingin diubah icon-nya:', { ...keyboard });
    } catch (err) {
      await ctx.reply('Pilih kategori yang ingin diubah icon-nya:', keyboard);
    }
  });

  bot.action(/set:icon:product:page:(\d+)/, async (ctx) => {
    if (!isAdmin(ctx.from?.id)) return ctx.answerCbQuery('Hanya admin yang dapat mengubah icon.');
    const page = Number(ctx.match[1]);
    const keyboard = buildCategorySelectionKeyboard('set:icon:product', page);
    if (!keyboard) return ctx.answerCbQuery('Tidak ada kategori untuk dipilih.');
    try {
      await ctx.editMessageText('Pilih kategori produk terlebih dahulu:', { ...keyboard });
    } catch (err) {
      await ctx.reply('Pilih kategori produk terlebih dahulu:', keyboard);
    }
  });

  bot.action(/set:icon:product:([^:]+):page:(\d+)/, async (ctx) => {
    if (!isAdmin(ctx.from?.id)) return ctx.answerCbQuery('Hanya admin yang dapat mengubah icon.');
    const categoryId = ctx.match[1];
    const page = Number(ctx.match[2]);
    const keyboard = buildProductSelectionKeyboard(categoryId, page);
    if (!keyboard) return ctx.answerCbQuery('Kategori tidak ditemukan atau belum ada produk.');
    try {
      await ctx.editMessageText('Pilih produk yang ingin diubah icon-nya:', { ...keyboard });
    } catch (err) {
      await ctx.reply('Pilih produk yang ingin diubah icon-nya:', keyboard);
    }
  });

  bot.action(/set:config:(.+)/, async (ctx) => {
    if (!isAdmin(ctx.from?.id)) return ctx.answerCbQuery('Hanya admin yang dapat mengubah konfigurasi.');
    const key = ctx.match[1];
    const prompt = configPrompts[key];
    if (!prompt) return ctx.answerCbQuery('Pengaturan tidak valid.');

    const chatId = ctx.from && ctx.from.id;
    if (chatId) {
      sessions[chatId] = { mode: 'set_config', key };
      try {
        const msg = ctx.update && ctx.update.callback_query && ctx.update.callback_query.message;
        if (msg && msg.message_id) sessions[chatId].promptMessageId = msg.message_id;
      } catch (_) {}
    }

    const keyboard = Markup.inlineKeyboard([
      [{ text: 'Cancel', callback_data: 'set:config:cancel', style: btn.red }, { text: 'Home', callback_data: 'home', style: btn.green }]
    ]);
    try {
      await ctx.editMessageText(`${prompt}\n\nKirim pesan dengan nilai baru untuk pengaturan ini.`, keyboard);
    } catch (err) {
      await ctx.reply(`${prompt}\n\nKirim pesan dengan nilai baru untuk pengaturan ini.`, keyboard);
    }
  });

  bot.action('set:config:cancel', async (ctx) => {
    if (!isAdmin(ctx.from?.id)) return ctx.answerCbQuery('Hanya admin yang dapat mengubah konfigurasi.');
    const chatId = ctx.from && ctx.from.id;
    if (chatId) clearSession(chatId);
    const keyboard = buildSetMenuKeyboard();
    try {
      await ctx.editMessageText('Pengaturan dibatalkan. Pilih lagi:', { ...keyboard });
    } catch (err) {
      await ctx.reply('Pengaturan dibatalkan. Pilih lagi:', keyboard);
    }
  });

  bot.on('message', async (ctx, next) => {
    const chatId = ctx.from && ctx.from.id;
    if (!chatId) return next();
    const session = sessions[chatId];
    if (!session || session.mode !== 'set_config') return next();

    const text = ctx.message && ctx.message.text ? ctx.message.text.trim() : '';
    if (!text || text.startsWith('/')) return next();

    const key = session.key;
    const cfg = readConfig();
    const [root, property] = key.split('.');
    cfg[root] = cfg[root] || {};

    if (['bot.btnCtr', 'bot.btnPrd'].includes(key)) {
      const value = Number(text);
      if (Number.isNaN(value) || value < 0) {
        return ctx.reply('Masukkan angka valid untuk jumlah kolom tombol.');
      }
      cfg[root][property] = value;
    } else {
      cfg[root][property] = text;
    }

    writeConfig(cfg);
    clearSession(chatId);

    const keyboard = buildSetMenuKeyboard();
    try {
      await ctx.reply(`Pengaturan ${key} berhasil diubah menjadi: ${text}`, keyboard);
    } catch (err) {
      await ctx.reply(`Pengaturan ${key} berhasil diubah menjadi: ${text}`);
    }
  });

  bot.action(/set:icon:category:([^:]+):icon:(.+)/, async (ctx) => {
    if (!isAdmin(ctx.from?.id)) return ctx.answerCbQuery('Hanya admin yang dapat mengubah icon.');
    const categoryId = ctx.match[1];
    const iconKey = ctx.match[2];
    const products = readJsonFile(productDbPath, []);
    if (!Array.isArray(products)) return ctx.answerCbQuery('Data produk tidak valid.');
    const category = products.find((c) => String(c.id) === String(categoryId));
    if (!category) return ctx.answerCbQuery('Kategori tidak ditemukan.');
    const emojiMapDb = readEmojiMap();
    const iconConfig = getEmojiConfig(emojiMapDb, iconKey);
    if (!iconConfig || !iconConfig.id) return ctx.answerCbQuery(`Emoji key ${iconKey} tidak valid.`);
    category.icon = iconKey;
    writeJsonFile(productDbPath, products);
    const keyboard = Markup.inlineKeyboard([
      [{ text: 'Set another category icon', callback_data: 'set:icon:category', style: btn.blue }],
      [{ text: 'Back to menu', icon_custom_emoji_id: emojiMap.homes, callback_data: 'set:icon:menu', style: btn.red }, { text: 'Home', callback_data: 'home', style: btn.green }]
    ]);
    await ctx.editMessageText(`Icon kategori <b>${category.name || category.id}</b> berhasil diatur ke ${iconKey}.`, { ...keyboard, parse_mode: 'HTML' });
    await ctx.answerCbQuery('Icon kategori berhasil diperbarui.');
  });

  bot.action(/set:icon:category:([^:]+)$/, async (ctx) => {
    if (!isAdmin(ctx.from?.id)) return ctx.answerCbQuery('Hanya admin yang dapat mengubah icon.');
    const categoryId = ctx.match[1];
    const products = readJsonFile(productDbPath, []);
    const category = Array.isArray(products) ? products.find((c) => String(c.id) === String(categoryId)) : null;
    if (!category) return ctx.answerCbQuery('Kategori tidak ditemukan.');
    const emojiMapDb = readEmojiMap();
    const iconKeys = Object.keys(emojiMapDb);
    const keyboard = buildIconSelectionKeyboard(`set:icon:category:${categoryId}`, iconKeys, 'set:icon:category');
    if (!keyboard) return ctx.answerCbQuery('Tidak ada icon tersedia.');
    try {
      await ctx.editMessageText(`Pilih icon untuk kategori ${category.name || category.id}:`, { ...keyboard });
    } catch (err) {
      await ctx.reply(`Pilih icon untuk kategori ${category.name || category.id}:`, keyboard);
    }
  });

  bot.action(/set:icon:product:([^:]+):([^:]+):icon:(.+)/, async (ctx) => {
    if (!isAdmin(ctx.from?.id)) return ctx.answerCbQuery('Hanya admin yang dapat mengubah icon.');
    const categoryId = ctx.match[1];
    const productId = ctx.match[2];
    const iconKey = ctx.match[3];
    const products = readJsonFile(productDbPath, []);
    if (!Array.isArray(products)) return ctx.answerCbQuery('Data produk tidak valid.');
    const category = products.find((c) => String(c.id) === String(categoryId));
    if (!category) return ctx.answerCbQuery('Kategori tidak ditemukan.');
    const item = Array.isArray(category.items) ? category.items.find((i) => String(i.id) === String(productId)) : null;
    if (!item) return ctx.answerCbQuery('Produk tidak ditemukan.');
    const emojiMapDb = readEmojiMap();
    const iconConfig = getEmojiConfig(emojiMapDb, iconKey);
    if (!iconConfig || !iconConfig.id) return ctx.answerCbQuery(`Emoji key ${iconKey} tidak valid.`);
    item.icon = iconKey;
    writeJsonFile(productDbPath, products);
    const keyboard = Markup.inlineKeyboard([
      [{ text: 'Set another product icon', callback_data: `set:icon:product:${categoryId}`, style: btn.blue }],
      [{ text: 'Back to menu', icon_custom_emoji_id: emojiMap.homes, callback_data: 'set:icon:menu', style: btn.red }, { text: 'Home', callback_data: 'home', style: btn.green }]
    ]);
    await ctx.editMessageText(`Icon produk <b>${item.name || item.id}</b> berhasil diatur ke ${iconKey}.`, { ...keyboard, parse_mode: 'HTML' });
    await ctx.answerCbQuery('Icon produk berhasil diperbarui.');
  });

  bot.action('set:icon:menu', async (ctx) => {
    if (!isAdmin(ctx.from?.id)) return ctx.answerCbQuery('Hanya admin yang dapat mengubah konfigurasi.');
    const keyboard = buildSetMenuKeyboard();
    try {
      await ctx.editMessageText('Pilih pengaturan yang ingin diubah menggunakan tombol di bawah ini:', { ...keyboard });
    } catch (err) {
      await ctx.reply('Pilih pengaturan yang ingin diubah menggunakan tombol di bawah ini:', keyboard);
    }
  });

  bot.action(/set:icon:product:([^:]+):([^:]+)$/, async (ctx) => {
    if (!isAdmin(ctx.from?.id)) return ctx.answerCbQuery('Hanya admin yang dapat mengubah icon.');
    const categoryId = ctx.match[1];
    const productId = ctx.match[2];
    const products = readJsonFile(productDbPath, []);
    if (!Array.isArray(products)) return ctx.answerCbQuery('Data produk tidak valid.');
    const category = products.find((c) => String(c.id) === String(categoryId));
    if (!category) return ctx.answerCbQuery('Kategori tidak ditemukan.');
    const item = Array.isArray(category.items) ? category.items.find((i) => String(i.id) === String(productId)) : null;
    if (!item) return ctx.answerCbQuery('Produk tidak ditemukan.');
    const emojiMapDb = readEmojiMap();
    const iconKeys = Object.keys(emojiMapDb);
    const keyboard = buildIconSelectionKeyboard(
      `set:icon:product:${categoryId}:${productId}`,
      iconKeys,
      `set:icon:product:${categoryId}`
    );
    if (!keyboard) return ctx.answerCbQuery('Tidak ada icon tersedia.');
    try {
      await ctx.editMessageText(`Pilih icon untuk produk ${item.name || item.id}:`, { ...keyboard });
    } catch (err) {
      await ctx.reply(`Pilih icon untuk produk ${item.name || item.id}:`, keyboard);
    }
  });

  bot.action(/set:icon:category:([^:]+):page:(\d+)/, async (ctx) => {
    if (!isAdmin(ctx.from?.id)) return ctx.answerCbQuery('Hanya admin yang dapat mengubah icon.');
    const categoryId = ctx.match[1];
    const page = Number(ctx.match[2]);
    const products = readJsonFile(productDbPath, []);
    const category = Array.isArray(products) ? products.find((c) => String(c.id) === String(categoryId)) : null;
    if (!category) return ctx.answerCbQuery('Kategori tidak ditemukan.');
    const emojiMapDb = readEmojiMap();
    const iconKeys = Object.keys(emojiMapDb);
    const keyboard = buildIconSelectionKeyboard(
      `set:icon:category:${categoryId}`,
      iconKeys,
      'set:icon:category',
      page
    );
    if (!keyboard) return ctx.answerCbQuery('Tidak ada icon tersedia.');
    try {
      await ctx.editMessageText(`Pilih icon untuk kategori ${category.name || category.id}:`, { ...keyboard });
    } catch (err) {
      await ctx.reply(`Pilih icon untuk kategori ${category.name || category.id}:`, keyboard);
    }
  });

  bot.action(/set:icon:product:([^:]+):([^:]+):page:(\d+)/, async (ctx) => {
    if (!isAdmin(ctx.from?.id)) return ctx.answerCbQuery('Hanya admin yang dapat mengubah icon.');
    const categoryId = ctx.match[1];
    const productId = ctx.match[2];
    const page = Number(ctx.match[3]);
    const products = readJsonFile(productDbPath, []);
    const category = Array.isArray(products) ? products.find((c) => String(c.id) === String(categoryId)) : null;
    if (!category) return ctx.answerCbQuery('Kategori tidak ditemukan.');
    const item = Array.isArray(category.items) ? category.items.find((i) => String(i.id) === String(productId)) : null;
    if (!item) return ctx.answerCbQuery('Produk tidak ditemukan.');
    const emojiMapDb = readEmojiMap();
    const iconKeys = Object.keys(emojiMapDb);
    const keyboard = buildIconSelectionKeyboard(
      `set:icon:product:${categoryId}:${productId}`,
      iconKeys,
      `set:icon:product:${categoryId}`,
      page
    );
    if (!keyboard) return ctx.answerCbQuery('Tidak ada icon tersedia.');
    try {
      await ctx.editMessageText(`Pilih icon untuk produk ${item.name || item.id}:`, { ...keyboard });
    } catch (err) {
      await ctx.reply(`Pilih icon untuk produk ${item.name || item.id}:`, keyboard);
    }
  });

  bot.action(/set:icon:product:([^:]+)$/, async (ctx) => {
    if (!isAdmin(ctx.from?.id)) return ctx.answerCbQuery('Hanya admin yang dapat mengubah icon.');
    const categoryId = ctx.match[1];
    const keyboard = buildProductSelectionKeyboard(categoryId);
    if (!keyboard) return ctx.answerCbQuery('Kategori tidak ditemukan atau belum ada produk.');
    try {
      await ctx.editMessageText('Pilih produk yang ingin diubah icon-nya:', { ...keyboard });
    } catch (err) {
      await ctx.reply('Pilih produk yang ingin diubah icon-nya:', keyboard);
    }
  });
};

module.exports.sendSetMenu = sendSetMenu;
