import { updateLongProcess } from '../bot.ts';
import {
    ForceReply,
    InlineKeyboard,
    InlineKeyboardMarkup,
    ReplyKeyboardMarkup,
    ReplyKeyboardRemove,
} from '../pkg/grammy.ts';
import * as api from './api.ts';
import { Series } from './models.ts';

type TelegramRes = {
    message: string;
    markup?:
        | InlineKeyboardMarkup
        | ReplyKeyboardMarkup
        | ReplyKeyboardRemove
        | ForceReply;
};

type Response = TelegramRes | string;

export const prefix = 'sonarr:';

export const chatHandlers: Record<number, ChatHandler> = {};

function displaySeries(s: Series) {
    let res = `${s.title} ${s.year ?? ''} `;
    if (s.imdbId) {
        res += `\nhttps://www.imdb.com/title/${s.imdbId}`;
    } else if (s.remotePoster) {
        res += `\n${s.remotePoster}`;
    }
    return res;
}

function stringToMessage(res: Response): TelegramRes {
    if (typeof res === 'string') {
        return { message: res };
    }
    return res;
}

export const keys = {
    health: 'OK?',
    search: 'Search',
    more: 'Next >>',
    grub: 'Grub',
    list: 'List',
} as const;

type Action = typeof keys[keyof typeof keys];

type ActionResponse = Promise<Response> | Response;

class ChatHandler {
    handelText?: (text: string) => Promise<TelegramRes>;
    searchResults?: Series[];
    currentIndex = -1;

    constructor(private readonly chatId: number) {}

    actions: Record<Action, () => ActionResponse> = {
        [keys.health]: async () => {
            const healthy = await this.updateProgress(api.health());
            return healthy ? '👌' : '😥';
        },
        [keys.search]: () => {
            this.handelText = async (text) =>
                stringToMessage(await this.waitForShowName(text));

            return {
                message: 'Search for..?',
                markup: { force_reply: true },
            };
        },
        [keys.more]: () => this.replaySearchResult(),
        [keys.grub]: () => this.grubCurrentSeries(),
        [keys.list]: () => {
            return 'list';
        },
    };

    private waitForShowName = async (text: string) => {
        this.stopWaiting();
        try {
            this.searchResults = await this.updateProgress(api.search(text));
            this.currentIndex = -1;
            return this.replaySearchResult();
        } catch (_) {
            return '😵';
        }
    };

    private replaySearchResult() {
        const current = this.getNextSearch();
        if (!current) {
            return 'No result to show';
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

    private async grubCurrentSeries() {
        const { searchResults, currentIndex } = this;
        const current = searchResults?.[currentIndex];
        if (!current || current.id) {
            return current
                ? 'You already have that 👍'
                : 'cant found series to grub';
        }
        const res = await this.updateProgress(api.add(current));

        return res ? '👌' : '😿';
    }

    private updateProgress<T>(promise: Promise<T>) {
        return updateLongProcess(this.chatId, promise);
    }
}

export function keyboard(actions: Action[]) {
    return new InlineKeyboard([
        actions.map((key) => ({ text: key, callback_data: prefix + key })),
    ]);
}

export async function handleAction(option: string, chatId?: number) {
    const key = option.split(prefix)[1] as Action;
    if (!chatId) {
        return;
    }
    chatHandlers[chatId] ??= new ChatHandler(chatId);
    return stringToMessage(await chatHandlers[chatId].actions[key]?.());
}
