import { Bot } from './pkg/grammy.ts';
import { config } from './config.ts';
import { sonarr } from './sonarr/index.ts';

const bot = new Bot(config.BOT_TOKEN);

bot.command('sonarr', (ctx) => {
    ctx.reply('Sonarr options:', {
        reply_markup: sonarr.keyboard(['ok?', 'new show']),
    });
});

bot.on('message:text', async (ctx) => {
    const { handelText } = sonarr.chatHandlers[ctx.chat.id] ?? {};
    if (!handelText) {
        return;
    }
    const { message, markup } = await handelText(ctx.message.text);
    ctx.reply(message, {
        reply_markup: markup,
        parse_mode: 'HTML',
    });
});

bot.on('callback_query', async (ctx) => {
    const { data } = ctx.update.callback_query as { data: string };
    console.log('call', data);
    if (data.startsWith(sonarr.prefix)) {
        const res = await sonarr.handleAction(data, ctx.chat?.id);
        res && ctx.reply(res.message, { reply_markup: res.markup });
    }
    ctx.answerCallbackQuery();
});

bot.start({ drop_pending_updates: true });
console.log('started');

await bot.api.setMyCommands([
    { command: 'sonarr', description: 'show tv show options' },
]);
console.log('send commands');

// Enable graceful stop
Deno.addSignalListener('SIGINT', () => bot.stop());
Deno.addSignalListener('SIGTERM', () => bot.stop());
