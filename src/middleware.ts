import { config } from './common/config.ts';
import { Middleware } from './pkg/grammy.ts';

const allowedChats: number[] = JSON.parse(config.ALLOWED_CHATS);

export const log: Middleware = async ({ message, callbackQuery, chat }, next) => {
    const text = message?.text;
    const data = callbackQuery?.data;
    console.log(chat?.id ?? '-', JSON.stringify({ text, data }));
    await next();
};

export const auth: Middleware = async ({ chat }, next) => {
    if (!chat?.id || !allowedChats.includes(chat.id)) {
        console.log(`got message from chat: ${JSON.stringify(chat)}`);
        return;
    }
    await next();
};
