module.exports = {
  registerMessageHandler(bot, logger) {
    bot.on('message', async (ctx, next) => {
      const text = ctx.message && ctx.message.text;
      if (text && text.startsWith('/')) return next();

      // Allow reply keyboard buttons to pass through
      const allowedKeywords = ['belanja', 'profil', 'deposit', 'bantuan', 'dashboard', 'stats', 'add', 'set', 'home', 'kembali'];
      const lower = text ? String(text).toLowerCase() : '';
      if (allowedKeywords.some(k => lower.includes(k))) return next();

      await ctx.reply('Kirim /start untuk memulai.');
      if (logger) logger.message('incoming', 'from', ctx.from.username || ctx.from.first_name || 'unknown');
    });
  }
};
