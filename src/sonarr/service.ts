import { bot } from '../common/bot.ts';
import { formatFileSize } from '../common/utils.ts';
import * as api from './api.ts';
import { Series } from './models.ts';
import { Actions, buildActionHandler, buildChatHandlerGetter, ChatHandler, buildKeyboardBuilder } from '../common/chatHandler.ts';

export const prefix = 'sonarr:';

function displaySeries(s: Series) {
    let res = `${s.id ? '✅' : ''} ${s.title} ${s.year || ''} `;
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
type Keys = typeof keys;

class SonarrChatHandler extends ChatHandler<Keys> {
    searchResults?: Series[];

    constructor(readonly chatId: number) {
        super(chatId);
        this.setDefaultTextHandling();
    }

    actions: Actions<Keys> = {
        [keys.health]: async () => {
            const healthy = await this.updateProgress(api.health());
            return healthy ? '👌' : '😥';
        },
        [keys.search]: () => this.replayToSearch(),
        [keys.more]: (index) => this.displayNextSearch(index),
        [keys.grub]: (index) => this.grubCurrentSeries(index),
        [keys.list]: () => this.getMyShows(),
        [keys.info]: (id) => this.getShowInfo(id),
        [keys.delete]: (id) => this.deleteShow(id),
    };

    private replayToSearch() {
        this.handelText = (text) => {
            this.setDefaultTextHandling();
            return this.handelShowName(text);
        };

        return {
            message: 'Search for..?',
            markup: { force_reply: true as const },
        };
    }

    private async handelShowName(text: string) {
        try {
            this.searchResults = await this.updateProgress(api.search(text));
            return this.displayNextSearch(-1);
        } catch (_) {
            return '😵';
        }
    }

    private async handelShowId(id: number) {
        const series = await this.getMyShow(id);
        return series
            ? {
                  message: displaySeries(series),
                  markup: keyboard([`${keys.info}:${series.id}`, `${keys.delete}:${series.id}`]),
              }
            : '🤷🏻‍♂';
    }

    private async getShowInfo(id?: number | string) {
        id = Number(id);
        const series = await this.getMyShow(id);

        const seasonData = series?.seasons.map((s) => ` - Season ${s.seasonNumber} ${s.monitored ? '🧐' : '🙈'}\n`).join('');

        let info = `Status: ${series?.status}\n`;
        info += `Network: ${series?.network}\n`;
        info += series?.monitored ? 'Monitored:\n' + seasonData : `Not monitored 🙈\n`;
        info += '\n';
        info += `Episodes: ${series?.statistics.episodeCount} / ${series?.statistics.totalEpisodeCount}\n`;
        info += `${formatFileSize(series?.statistics.sizeOnDisk)} (${series?.statistics.episodeFileCount} episode files)\n`;

        return series ? info : '🤷🏻‍♂';
    }

    private async deleteShow(id?: number | string) {
        id = Number(id);
        const series = await this.getMyShow(id);
        if (!series?.id) {
            return 'Could not find this show';
        }
        this.handelText = async (text) => {
            this.setDefaultTextHandling();
            if (text.toLowerCase() === 'yes') {
                const success = await api.deleteSeries(series.id!);
                return success ? '🆗' : 'Something went wrong😿';
            }
            return '🫶';
        };

        return {
            message: `Are you sure you want to delete "${series.title}"? (yes)`,
            markup: { force_reply: true as const },
        };
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
            markup: keyboard([`${keys.more}:${index}`, current.id ? `${keys.info}:${current.id}` : `${keys.grub}:${index}`]),
        };
    }

    private setDefaultTextHandling() {
        this.handelText = this.defaultHandleText;
    }

    private defaultHandleText = async (text: string) => {
        if (text.startsWith('/')) {
            const id = Number(text.slice(1));
            if (Number.isInteger(id)) {
                return this.handelShowId(id);
            }
            return '😕';
        }
        await bot.api.sendMessage(this.chatId, `Searching "${text}"...`);
        return this.handelShowName(text);
    };

    private grubCurrentSeries(index?: string | number) {
        index = Number(index);
        const current = this.searchResults?.[index];
        if (!current || current.id) {
            return current ? 'You already have that 👍' : 'cant found series to grub';
        }

        this.handelText = async (text) => {
            this.setDefaultTextHandling();

            if (text.toLocaleLowerCase() !== 'yes') {
                return '🤷🏻‍♂';
            }
            const res = await this.updateProgress(api.add(current));
            return res ? '👌' : '😿';
        };

        return {
            message: `Sure you want to add "${current.title}" to the library? (yes)`,
            markup: { force_reply: true as const },
        };
    }

    private async getMyShows() {
        try {
            const series = await this.updateProgress(api.getMyList());
            return series.map((s) => `/${s.id} ${s.title}`).join('\n');
        } catch (error) {
            console.error(error);
            return '😓';
        }
    }

    private async getMyShow(id: number) {
        try {
            return await this.updateProgress(api.getMyList(id));
        } catch (error) {
            console.error(error);
            return undefined;
        }
    }
}

export const keyboard = buildKeyboardBuilder<Keys>(prefix);
export const getChatHandler = buildChatHandlerGetter(SonarrChatHandler);
export const handleAction = buildActionHandler(getChatHandler);
