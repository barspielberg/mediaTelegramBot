import { Telegraf } from 'telegraf';
import { sonarr } from './sonarr';

require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN ?? '');

bot.start((ctx) => ctx.reply('Welcome'));

bot.command('sonarr', (ctx) => {
    ctx.reply('Sonarr options:', sonarr.keyboard);
});

bot.on('callback_query', async (ctx) => {
    const { data } = ctx.update.callback_query as { data: string };
    console.log('call', data);
    if (data.startsWith(sonarr.prefix)) {
        const res = await sonarr.handleAction(data);
        ctx.reply(res);
    }
    ctx.answerCbQuery('✅');
});

bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
