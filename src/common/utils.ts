import { bot } from './bot.ts';
import { TelegramRes } from './types.ts';

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
    let res: T;
    let err;
    try {
        res = await promise;
    } catch (error) {
        err = error;
    }
    clearTimeout(timeout);

    if (messageId) {
        (async () => {
            await api.editMessageText(chatId, messageId, 'Done! 🦾').catch(console.error);
            setTimeout(() => api.deleteMessage(chatId, messageId!).catch(console.error), 3000);
        })();
    }
    if (err) {
        throw err;
    }
    return res!;
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
