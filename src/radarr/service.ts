import { bot } from '../common/bot.ts';
import { buildKeyboardBuilder, buildChatHandlerGetter, buildActionHandler, ChatHandler, Actions } from '../common/chatHandler.ts';
import * as api from './api.ts';
import { Movie } from './models.ts';

export const prefix = 'radarr:';

function displayMovie(m: Movie) {
    let res = `${m.id ? '✅' : ''} ${m.title} ${m.year || ''} `;
    if (m.imdbId) {
        res += `\nhttps://www.imdb.com/title/${m.imdbId}`;
    } else if (m.remotePoster) {
        res += `\n${m.remotePoster}`;
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

class RadarrChatHandler extends ChatHandler<Keys> {
    searchResults?: Movie[];
    constructor(readonly chatId: number) {
        super(chatId);
    }
    actions: Actions<Keys> = {
        [keys.health]: async () => {
            const healthy = await this.updateProgress(api.health());
            return healthy ? '👌' : '😥';
        },
        [keys.list]: () => this.getMyMovies(),
        [keys.search]: () => this.replayToSearch(),
        [keys.more]: (index) => this.displayNextSearch(index),
        [keys.grub]: (index) => this.grubCurrentMovie(index),
        [keys.info]: (id) => this.getMovieInfo(id),
        [keys.delete]: (id) => this.deleteMovie(id),
    };

    private replayToSearch() {
        this.handelText = (text) => {
            this.setDefaultTextHandling();
            return this.handelMovieName(text);
        };

        return {
            message: 'Search for..?',
            markup: { force_reply: true as const },
        };
    }

    private async handelMovieName(text: string) {
        try {
            this.searchResults = await this.updateProgress(api.search(text));
            return this.displayNextSearch(-1);
        } catch (_) {
            return '😵';
        }
    }

    private async handelMovieId(id: number) {
        const movie = await this.getMyMovie(id);
        return movie
            ? {
                  message: displayMovie(movie),
                  markup: keyboard([`${keys.info}:${movie.id}`, `${keys.delete}:${movie.id}`]),
              }
            : '🤷🏻‍♂';
    }

    private async getMovieInfo(id?: number | string) {
        id = Number(id);
        const movie = await this.getMyMovie(id);

        let info = `info`;
        //TODO

        return movie ? info : '🤷🏻‍♂';
    }

    private async deleteMovie(id?: number | string) {
        id = Number(id);
        const movie = await this.getMyMovie(id);
        if (!movie?.id) {
            return 'Could not find this show';
        }
        this.handelText = async (text) => {
            this.setDefaultTextHandling();
            if (text.toLowerCase() === 'yes') {
                const success = await api.deleteMovie(movie.id!);
                return success ? '🆗' : 'Something went wrong😿';
            }
            return '🫶';
        };

        return {
            message: `Are you sure you want to delete "${movie.title}"? (yes)`,
            markup: { force_reply: true as const },
        };
    }

    private displayNextSearch(index?: string | number) {
        index = Number(index);
        const current = this.searchResults?.[++index];
        if (!current) {
            return 'No result to show';
        }
        const message = displayMovie(current);
        return {
            message,
            markup: keyboard([`${keys.more}:${index}`, current.id ? `${keys.info}:${current.id}` : `${keys.grub}:${index}`]),
        };
    }

    private setDefaultTextHandling() {
        this.handelText = undefined;
    }

    public defaultHandleText = async (text: string) => {
        if (text.startsWith('/')) {
            const id = Number(text.slice(1));
            if (Number.isInteger(id)) {
                return this.handelMovieId(id);
            }
            return '😕';
        }
        await bot.api.sendMessage(this.chatId, `Searching "${text}"...`);
        return this.handelMovieName(text);
    };

    private grubCurrentMovie(index?: string | number) {
        index = Number(index);
        const current = this.searchResults?.[index];
        if (!current || current.id) {
            return current ? 'You already have that 👍' : 'cant found movies to grub';
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

    private async getMyMovies() {
        try {
            const movies = await this.updateProgress(api.getMyList());
            return movies.map((s) => `/${s.id} ${s.title}`).join('\n');
        } catch (error) {
            console.error(error);
            return '😓';
        }
    }

    private async getMyMovie(id: number) {
        try {
            return await this.updateProgress(api.getMyList(id));
        } catch (error) {
            console.error(error);
            return undefined;
        }
    }
}

export const keyboard = buildKeyboardBuilder<Keys>(prefix);
export const getChatHandler = buildChatHandlerGetter(RadarrChatHandler);
export const handleAction = buildActionHandler(getChatHandler);
