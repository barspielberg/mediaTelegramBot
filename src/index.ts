import { bot } from './common/bot.ts';
import * as middleware from './middleware.ts';
import { sonarr } from './sonarr/index.ts';
import { radarr } from './radarr/index.ts';
import { stringToMessage } from './common/utils.ts';
import { InlineKeyboard } from './pkg/grammy.ts';
import { keys } from './common/mediaChatHandler.ts';

const SEARCH = 'search:';
function searchOptions(text: string) {
    return new InlineKeyboard().text('Movie', SEARCH + radarr.prefix + text).text('Tv show', SEARCH + sonarr.prefix + text);
}
const services = [sonarr, radarr];

bot.use(middleware.log, middleware.auth);

bot.command('sonarr', (ctx) => {
    ctx.reply('Sonarr options:', {
        reply_markup: sonarr.keyboard([keys.search, keys.list, keys.health]),
    });
});

bot.command('radarr', (ctx) => {
    ctx.reply('Radarr options:', {
        reply_markup: radarr.keyboard([keys.search, keys.list, keys.health]),
    });
});

bot.on('message:text', async (ctx) => {
    const { id } = ctx.chat;
    const handelText = services.map((s) => s.getChatHandler(id).handelText).find(Boolean);
    const { text } = ctx.message;

    const res = await (() => {
        if (handelText) {
            return handelText(text);
        }
        if (text.startsWith('/')) {
            for (const service of services) {
                if (text.startsWith(service.mark)) {
                    return service.getChatHandler(id).defaultHandleText(text);
                }
            }
        }
        return { message: 'Looking for?', markup: searchOptions(text) };
    })();

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
    const { id } = ctx.chat ?? {};
    const res = await (() => {
        if (!id) {
            return;
        }
        const service = services.find((s) => data.includes(s.prefix));
        if (data.startsWith(SEARCH)) {
            const [, , text] = data.split(':');
            return service?.getChatHandler(id).defaultHandleText(text);
        }
        return service?.handleAction(data, id);
    })();

    if (res) {
        const { message, markup } = stringToMessage(res);
        ctx.reply(message, { reply_markup: markup });
    }
    ctx.answerCallbackQuery();
});

bot.start({ drop_pending_updates: true }).catch(console.error);
console.log('started');

await bot.api.setMyCommands([
    { command: 'sonarr', description: 'Tv show options' },
    { command: 'radarr', description: 'Movies options' },
]);
console.log('send commands');

// Enable graceful stop
Deno.addSignalListener('SIGINT', () => bot.stop());
Deno.addSignalListener('SIGTERM', () => bot.stop());
