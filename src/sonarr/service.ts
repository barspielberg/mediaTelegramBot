import { InlineKeyboard, ReplyMessage } from '../packages/grammy.ts';
import * as api from './api.ts';
import { Series } from './types.ts';

export const prefix = 'sonarr:';

export const chatState: Record<number, State> = {};

type Response = {
    message: string;
    markup?: ReplyMessage['reply_markup'];
};

type State = {
    waitingFor?: (text: string) => Promise<Response>;
    currentSearch?: Series[];
};

const seriesInPage = 5;
function getNextSearch(chatId: number) {
    const { currentSearch } = chatState[chatId];
    console.log('current', currentSearch?.length);

    if (!currentSearch) {
        return undefined;
    }
    chatState[chatId].currentSearch = currentSearch.slice(seriesInPage);
    return currentSearch.slice(0, seriesInPage);
}

function displaySeries(se: Series[]) {
    return se.map((s) => s.title).join(', ');
}

const keys = {
    health: 'ok?',
    search: 'new show',
    more: 'more?',
} as const;

type Action = typeof keys[keyof typeof keys];

const actions: Record<
    Action,
    (chatId: number) => Promise<Response | undefined> | Response | undefined
> = {
    [keys.health]: async () => {
        return { message: (await api.health()) ? '👌' : '😥' };
    },
    [keys.search]: (chatId) => {
        chatState[chatId].waitingFor = async (text) => {
            chatState[chatId].waitingFor = undefined;
            try {
                chatState[chatId].currentSearch = await api.search(text);
                return {
                    message: displaySeries(getNextSearch(chatId)!),
                    markup: keyboard([keys.more]),
                };
            } catch (_) {
                return { message: '😵' };
            }
        };
        return { message: 'what to search?' };
    },
    [keys.more]: (chatId) => {
        const current = getNextSearch(chatId);
        if (!current || current?.length <= 0) {
            return { message: 'no more' };
        }
        return {
            message: displaySeries(current),
            markup: keyboard([keys.more]),
        };
    },
};

export function keyboard(actions: Action[]) {
    return new InlineKeyboard(
        actions.map((key) => [{ text: key, callback_data: prefix + key }])
    );
}

export function handleAction(option: string, chatId?: number) {
    const key = option.split(prefix)[1] as Action;
    if (!chatId) {
        return;
    }
    chatState[chatId] ??= {};
    return actions[key]?.(chatId);
}
