import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { config } from './config';
import { sonarr } from './sonarr';

const bot = new Telegraf(config.BOT_TOKEN);

bot.start((ctx) => ctx.reply('Welcome'));

bot.command('sonarr', (ctx) => {
    ctx.reply('Sonarr options:', sonarr.keyboard(['ok?', 'new show']));
});

bot.on(message('text'), async (ctx) => {
    const { waitingFor } = sonarr.chatState[ctx.chat.id] ?? {};
    if (waitingFor) {
        const { message, markup } = await waitingFor(ctx.message.text);
        ctx.reply(message, markup);
    }
});

bot.on('callback_query', async (ctx) => {
    const { data } = ctx.update.callback_query as { data: string };
    console.log('call', data);
    if (data.startsWith(sonarr.prefix)) {
        const res = await sonarr.handleAction(data, ctx.chat?.id);
        res && ctx.reply(res.message, res.markup);
    }
    ctx.answerCbQuery('✅');
});

bot.launch({ dropPendingUpdates: true });

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
