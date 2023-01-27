import {
    ForceReply,
    InlineKeyboard,
    InlineKeyboardMarkup,
    ReplyKeyboardMarkup,
    ReplyKeyboardRemove,
} from '../pkg/grammy.ts';
import * as api from './api.ts';
import { Series } from './models.ts';

type Response = {
    message: string;
    markup?:
        | InlineKeyboardMarkup
        | ReplyKeyboardMarkup
        | ReplyKeyboardRemove
        | ForceReply;
};

export const prefix = 'sonarr:';

export const chatHandlers: Record<number, ChatHandler> = {};

function displaySeries(s: Series) {
    let res = `${s.title} ${s.year} `;
    if (s.imdbId) {
        res += `\nhttps://www.imdb.com/title/${s.imdbId}`;
    } else {
        res += `\n${s.remotePoster}`;
    }
    return res;
}

const keys = {
    health: 'ok?',
    search: 'new show',
    more: 'next >>',
    grub: 'grub',
} as const;

type Action = typeof keys[keyof typeof keys];

type ActionResponse = Promise<Response | undefined> | Response | undefined;

class ChatHandler {
    handelText?: (text: string) => Promise<Response>;
    searchResults?: Series[];
    currentIndex = -1;

    actions: Record<Action, () => ActionResponse> = {
        [keys.health]: async () => {
            return { message: (await api.health()) ? '👌' : '😥' };
        },
        [keys.search]: () => {
            this.handelText = this.waitForShowName;
            return {
                message: 'what to search?',
                markup: { force_reply: true },
            };
        },
        [keys.more]: () => this.replaySearchResult(),
        [keys.grub]: () => {
            return {
                message: this.searchResults?.[this.currentIndex].title ?? 'k',
            };
        },
    };

    private waitForShowName = async (text: string) => {
        this.stopWaiting();
        try {
            this.searchResults = await api.search(text);
            this.currentIndex = -1;
            return this.replaySearchResult();
        } catch (_) {
            return { message: '😵' };
        }
    };

    private replaySearchResult() {
        const current = this.getNextSearch();
        if (!current) {
            return { message: 'no result to show' };
        }
        const message = displaySeries(current);
        return {
            message,
            markup: keyboard([keys.more, keys.grub]),
        };
    }

    private getNextSearch() {
        const { searchResults } = this;

        if (!searchResults) {
            return undefined;
        }
        return searchResults[++this.currentIndex];
    }

    private stopWaiting() {
        this.handelText = undefined;
    }
}

export function keyboard(actions: Action[]) {
    return new InlineKeyboard([
        actions.map((key) => ({ text: key, callback_data: prefix + key })),
    ]);
}

export function handleAction(option: string, chatId?: number) {
    const key = option.split(prefix)[1] as Action;
    if (!chatId) {
        return;
    }
    chatHandlers[chatId] ??= new ChatHandler();
    return chatHandlers[chatId].actions[key]?.();
}
