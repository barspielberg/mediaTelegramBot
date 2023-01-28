import { config } from './config.ts';
import { Bot } from './pkg/grammy.ts';

export const bot = new Bot(config.BOT_TOKEN);
const { api } = bot;

export async function updateLongProcess<T>(
    chatId: number,
    promise: Promise<T>
): Promise<T> {
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
        setTimeout(
            () => api.deleteMessage(chatId, messageId!).catch(console.error),
            3000
        );
    });

    return res;
}
