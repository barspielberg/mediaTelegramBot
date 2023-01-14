import { Markup, Telegraf } from 'telegraf';
import { sonarr } from './sonarr';
// import { message } from 'telegraf/filters';

require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN ?? '');

bot.start((ctx) => ctx.reply('Welcome'));
// bot.help((ctx) => ctx.reply('Send me a sticker'));
// bot.on(message('sticker'), (ctx) => ctx.reply('👍'));
sonarr.options.forEach((o) => {
    bot.hears(o, async (ctx) => {
        const res = await sonarr.handleAction(o);
        ctx.reply(res ?? 'unknown', Markup.removeKeyboard());
    });
});

bot.command('sonarr', (ctx) => {
    ctx.reply('What do you want to do?', Markup.keyboard([...sonarr.options]));
});
bot.command('close', (ctx) => {
    ctx.reply('👋', Markup.removeKeyboard());
});

bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
