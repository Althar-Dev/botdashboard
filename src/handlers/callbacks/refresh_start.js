const { startAction } = require('../commands/start');

module.exports = (bot, logger) => {
    bot.action('refresh_start', async (ctx) => {
        try { if (logger) logger.callback('refresh_start', 'callback', ctx.from && (ctx.from.username || ctx.from.first_name)); } catch(_) {}
            try { await ctx.sendChatAction('typing'); } catch(_) {}
        try {
            if (ctx.deleteMessage) {
                await ctx.deleteMessage();
            } else {
                await ctx.telegram.deleteMessage(ctx.chat.id, ctx.callbackQuery.message.message_id);
            }
        } catch (error) {
            console.error('Error deleting verification message:', error);
        }

        await startAction(ctx, logger);
    });
};
