import { config } from './config.ts';
import { Middleware } from './pkg/grammy.ts';

const allowedChats: number[] = JSON.parse(config.ALLOWED_CHATS);

export const log: Middleware = async ({ message, callbackQuery }, next) => {
    const text = message?.text;
    const data = callbackQuery?.data;
    console.log(JSON.stringify({ text, data }));
    await next();
};

export const auth: Middleware = async ({ chat }, next) => {
    if (!chat?.id || !allowedChats.includes(chat.id)) {
        console.log(`got message from chat: ${JSON.stringify(chat)}`);
        return;
    }
    await next();
};
