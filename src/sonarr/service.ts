import { bot } from '../bot.ts';
import { InlineKeyboard } from '../pkg/grammy.ts';
import { formatFileSize, TelegramRes, updateLongProcess } from '../utils.ts';
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
    info: 'Info',
    delete: 'Delete',
} as const;

type Action = typeof keys[keyof typeof keys];

type ActionResponse = Promise<Response> | Response;

class ChatHandler {
    handelText?: (text: string) => ActionResponse;
    searchResults?: Series[];
    myShows?: Series[];

    constructor(private readonly chatId: number) {
        this.setDefaultTextHandling();
    }

    actions: Record<Action, (data?: string) => ActionResponse> = {
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
        [keys.more]: (index) => this.displayNextSearch(index),
        [keys.grub]: (index) => this.grubCurrentSeries(index),
        [keys.list]: () => this.getMyShows(),
        [keys.info]: (index) => this.getShowInfo(index),
        [keys.delete]: (index) => this.deleteShow(index),
    };

    private async handelShowName(text: string) {
        try {
            this.searchResults = await this.updateProgress(api.search(text));
            return this.displayNextSearch(-1);
        } catch (_) {
            return '😵';
        }
    }

    private async handelShowIndex(index: number) {
        const series = await this.getMyShow(index);
        return series
            ? {
                  message: displaySeries(series),
                  markup: keyboard([`${keys.info}:${index}`, `${keys.delete}:${index}`]),
              }
            : '🤷🏻‍♂';
    }

    private async getShowInfo(index?: number | string) {
        index = Number(index);
        const series = await this.getMyShow(index);

        const seasonData = series?.seasons.map((s) => ` - Season ${s.seasonNumber} ${s.monitored ? '🕵️' : '🙈'}\n`).join('');

        let info = `Status: ${series?.status}\n`;
        info += `Network: ${series?.network}\n`;
        info += series?.monitored ? 'Monitored:\n' + seasonData : `Not monitored 🙈\n`;
        info += '\n';
        info += `Episodes: ${series?.statistics.episodeCount} / ${series?.statistics.totalEpisodeCount}\n`;
        info += `${formatFileSize(series?.statistics.sizeOnDisk)} (${series?.statistics.episodeFileCount} episode files)\n`;

        return series ? info : '🤷🏻‍♂';
    }

    private async deleteShow(index?: number | string) {
        index = Number(index);
        const series = await this.getMyShow(index);
        if (!series?.id) {
            return 'Could not find this show';
        }
        const success = await api.deleteSeries(series.id);
        return success ? '🆗' : 'Something want wrong😿';
    }

    private displayNextSearch(index?: string | number) {
        index = Number(index);
        const current = this.searchResults?.[++index];
        if (!current) {
            return 'No result to show';
        }
        const message = displaySeries(current);
        return {
            message,
            markup: keyboard([`${keys.more}:${index}`, `${keys.grub}:${index}`]),
        };
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

    private async grubCurrentSeries(index?: string | number) {
        index = Number(index);
        const current = this.searchResults?.[index];
        if (!current || current.id) {
            return current ? 'You already have that 👍' : 'cant found series to grub';
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

    private async getMyShow(index: number) {
        if (!this.myShows) {
            await this.getMyShows();
        }
        return this.myShows?.[index];
    }

    private updateProgress<T>(promise: Promise<T>) {
        return updateLongProcess(this.chatId, promise);
    }
}

export function keyboard(actions: (Action | `${Action}:${string}`)[]) {
    return new InlineKeyboard([
        actions.map((key) => ({
            text: key.split(':')[0],
            callback_data: prefix + key,
        })),
    ]);
}

export function getChatHandler(chatId: number) {
    chatHandlers[chatId] ??= new ChatHandler(chatId);
    return chatHandlers[chatId];
}

export function handleAction(option: string, chatId?: number) {
    const [_, key, data] = option.split(':') as [string, Action, string | undefined];
    if (!chatId) {
        return;
    }
    return getChatHandler(chatId).actions[key]?.(data);
}
