import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { config } from './config';
import { sonarr } from './sonarr';

const bot = new Telegraf(config.BOT_TOKEN);

bot.start((ctx) => ctx.reply('Welcome'));

bot.command('sonarr', (ctx) => {
    ctx.reply('Sonarr options:', sonarr.keyboard);
});

bot.on(message('text'), async (ctx) => {
    const { waitingFor } = sonarr.chatState[ctx.chat.id] ?? {};
    if (waitingFor) {
        const { message } = await waitingFor(ctx.message.text);
        ctx.reply(message);
    }
});

bot.on('callback_query', async (ctx) => {
    const { data } = ctx.update.callback_query as { data: string };
    console.log('call', data);
    if (data.startsWith(sonarr.prefix)) {
        const res = await sonarr.handleAction(data, ctx.chat?.id);
        res && ctx.reply(res);
    }
    ctx.answerCbQuery('✅');
});

bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
