import { bot } from './common/bot.ts';
import * as middleware from './middleware.ts';
import { sonarr } from './sonarr/index.ts';
import { stringToMessage } from './common/utils.ts';

bot.use(middleware.log, middleware.auth);

bot.command('sonarr', (ctx) => {
    ctx.reply('Sonarr options:', {
        reply_markup: sonarr.keyboard([sonarr.keys.health, sonarr.keys.search, sonarr.keys.list]),
    });
});

bot.on('message:text', async (ctx) => {
    const { handelText } = sonarr.getChatHandler(ctx.chat.id);
    if (!handelText) {
        return;
    }
    const res = await handelText(ctx.message.text);
    if (res) {
        const { message, markup } = stringToMessage(res);
        ctx.reply(message, {
            reply_markup: markup,
            parse_mode: 'HTML',
        });
    }
});

bot.on('callback_query', async (ctx) => {
    const { data } = ctx.update.callback_query as { data: string };
    if (data.startsWith(sonarr.prefix)) {
        const res = await sonarr.handleAction(data, ctx.chat?.id);
        if (res) {
            const { message, markup } = stringToMessage(res);
            ctx.reply(message, { reply_markup: markup });
        }
    }
    ctx.answerCallbackQuery();
});

bot.start({ drop_pending_updates: true }).catch(console.error);
console.log('started');

await bot.api.setMyCommands([{ command: 'sonarr', description: 'Tv show options' }]);
console.log('send commands');

// Enable graceful stop
Deno.addSignalListener('SIGINT', () => bot.stop());
Deno.addSignalListener('SIGTERM', () => bot.stop());
