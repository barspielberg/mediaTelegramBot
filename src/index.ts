import { Bot } from 'grammy';
import { config } from './config';
import { sonarr } from './sonarr';

const bot = new Bot(config.BOT_TOKEN);

bot.command('sonarr', (ctx) => {
    ctx.reply('Sonarr options:', {
        reply_markup: sonarr.keyboard(['ok?', 'new show']),
    });
});

bot.on('message:text', async (ctx) => {
    const { waitingFor } = sonarr.chatState[ctx.chat.id] ?? {};
    if (waitingFor) {
        const { message, markup } = await waitingFor(ctx.message.text);
        ctx.reply(message, {
            reply_markup: markup,
        });
    }
});

bot.on('callback_query', async (ctx) => {
    const { data } = ctx.update.callback_query as { data: string };
    console.log('call', data);
    if (data.startsWith(sonarr.prefix)) {
        const res = await sonarr.handleAction(data, ctx.chat?.id);
        res && ctx.reply(res.message, { reply_markup: res.markup });
    }
    ctx.answerCallbackQuery('✅');
});

bot.start({ drop_pending_updates: true });

// Enable graceful stop
process.once('SIGINT', () => bot.stop());
process.once('SIGTERM', () => bot.stop());
