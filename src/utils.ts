import { ForceReply, InlineKeyboardMarkup, ReplyKeyboardMarkup, ReplyKeyboardRemove } from './pkg/grammy.ts';
import { bot } from './bot.ts';

export type TelegramRes = {
    message: string;
    markup?: InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply;
};

const { api } = bot;

export async function updateLongProcess<T>(chatId: number, promise: Promise<T>): Promise<T> {
    let messageId: number | undefined;

    const timeout = setTimeout(async () => {
        try {
            const msg = await api.sendMessage(chatId, 'Working on it 🫡');
            messageId = msg.message_id;
        } catch (error) {
            console.error(error);
        }
    }, 1000);
    const res = await promise;

    clearTimeout(timeout);

    if (!messageId) {
        return res;
    }
    api.editMessageText(chatId, messageId, 'Done! 🦾').then(() => {
        setTimeout(() => api.deleteMessage(chatId, messageId!).catch(console.error), 3000);
    });

    return res;
}

export function stringToMessage(res: TelegramRes | string): TelegramRes {
    if (typeof res === 'string') {
        return { message: res };
    }
    return res;
}

const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
export function formatFileSize(bytes?: number, decimalPoint = 1) {
    if (!bytes) {
        return '0 Bytes';
    }
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(decimalPoint) + ' ' + sizes[i];
}
