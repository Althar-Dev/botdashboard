const { startAction } = require('../commands/start');

module.exports = (bot, logger) => {
  bot.action('home', async (ctx) => {
    try { if (logger) logger.callback('home', 'callback', ctx.from && (ctx.from.username || ctx.from.first_name)); } catch(_) {}
    try { await ctx.sendChatAction('typing'); } catch(_) {}
    try {
      if (ctx.deleteMessage) {
        await ctx.deleteMessage();
      } else {
        await ctx.telegram.deleteMessage(ctx.chat.id, ctx.callbackQuery.message.message_id);
      }
    } catch (err) {
    }

    await startAction(ctx, logger);
  });

  bot.hears([/home/i, '🏠 Home', 'Home'], async (ctx) => {
    try { if (logger) logger.callback('home', 'hears', ctx.from && (ctx.from.username || ctx.from.first_name)); } catch(_) {}
    try { await ctx.sendChatAction('typing'); } catch(_) {}

    await startAction(ctx, logger);
  });
};
