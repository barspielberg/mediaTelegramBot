import { bot } from '../bot.ts';
import { InlineKeyboard } from '../pkg/grammy.ts';
import { TelegramRes, updateLongProcess } from '../utils.ts';
import * as api from './api.ts';
import { Series } from './models.ts';

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
    handelText?: (text: string) => ActionResponse;
    searchResults?: Series[];
    currentSearchIndex = -1;
    myShows?: Series[];

    constructor(private readonly chatId: number) {
        this.setDefaultTextHandling();
    }

    actions: Record<Action, () => ActionResponse> = {
        [keys.health]: async () => {
            const healthy = await this.updateProgress(api.health());
            return healthy ? '👌' : '😥';
        },
        [keys.search]: () => {
            this.handelText = (text) => {
                this.setDefaultTextHandling();
                return this.handelShowName(text);
            };

            return {
                message: 'Search for..?',
                markup: { force_reply: true },
            };
        },
        [keys.more]: () => this.displayNextSearch(),
        [keys.grub]: () => this.grubCurrentSeries(),
        [keys.list]: () => this.getMyShows(),
    };

    private async handelShowName(text: string) {
        try {
            this.searchResults = await this.updateProgress(api.search(text));
            this.currentSearchIndex = -1;
            return this.displayNextSearch();
        } catch (_) {
            return '😵';
        }
    }

    private async handelShowIndex(index: number) {
        if (!this.myShows) {
            await this.getMyShows();
        }
        const series = this.myShows?.[index];
        if (!series) {
            return '🤷🏻‍♂';
        }
        return displaySeries(series);
    }

    private displayNextSearch() {
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
        return searchResults[++this.currentSearchIndex];
    }

    private setDefaultTextHandling() {
        this.handelText = this.defaultHandleText;
    }

    private defaultHandleText = async (text: string) => {
        if (text.startsWith('/')) {
            const index = Number(text.slice(1));
            if (Number.isInteger(index)) {
                return this.handelShowIndex(index);
            }
            return '😕';
        }
        await bot.api.sendMessage(this.chatId, `Searching "${text}"...`);
        return this.handelShowName(text);
    };

    private async grubCurrentSeries() {
        const { searchResults, currentSearchIndex } = this;
        const current = searchResults?.[currentSearchIndex];
        if (!current || current.id) {
            return current
                ? 'You already have that 👍'
                : 'cant found series to grub';
        }
        const res = await this.updateProgress(api.add(current));

        return res ? '👌' : '😿';
    }

    private async getMyShows() {
        try {
            const series = await this.updateProgress(api.getAllMy());
            this.myShows = series;
            return series.map((s, index) => `/${index} ${s.title}`).join('\n');
        } catch (error) {
            console.error(error);
            return '😓';
        }
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

export function getChatHandler(chatId: number) {
    chatHandlers[chatId] ??= new ChatHandler(chatId);
    return chatHandlers[chatId];
}

export function handleAction(option: string, chatId?: number) {
    const key = option.split(prefix)[1] as Action;
    if (!chatId) {
        return;
    }
    return getChatHandler(chatId).actions[key]?.();
}
