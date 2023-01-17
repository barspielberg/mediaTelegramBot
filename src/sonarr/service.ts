import { Markup } from 'telegraf';
import { InlineKeyboardMarkup } from 'telegraf/typings/core/types/typegram';
import * as api from './api';
import { Series } from './types';

type Response = {
    message: string;
    replay?: Markup.Markup<InlineKeyboardMarkup>;
};

type State = {
    waitingFor?: (text: string) => Promise<Response>;
    currentSearch?: Series[];
};

export const chatState: Record<number, State> = {};

export const prefix = 'sonarr:';
const actions = {
    'ok?': async () => {
        return (await api.health()) ? '👌' : '😥';
    },
    'new show': async (chatId?: number) => {
        if (!chatId) {
            return;
        }
        chatState[chatId].waitingFor = async (text) => {
            chatState[chatId].waitingFor = undefined;
            try {
                const res = await api.search(text);
                const titles = res.slice(0, 5).map((s) => s.title);
                return { message: titles.join(', ') };
            } catch (error) {
                return { message: '😵' };
            }
        };
        return 'what to search?';
    },
};

export const keyboard = Markup.inlineKeyboard(
    Object.keys(actions).map((key) => [
        { text: key, callback_data: prefix + key },
    ])
);

export async function handleAction(option: string, chatId?: number) {
    const key = option.split(prefix)[1] as keyof typeof actions;
    if (chatId) {
        chatState[chatId] ??= {};
    }
    return actions[key]?.(chatId);
}
