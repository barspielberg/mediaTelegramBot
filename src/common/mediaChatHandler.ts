import { bot } from '../common/bot.ts';
import { Movie } from '../radarr/models.ts';
import { Series } from '../sonarr/models.ts';
import { Actions, ChatHandler, KeyboardBuilder } from './chatHandler.ts';
import { ActionResponse } from './types.ts';

export const keys = {
    health: 'OK?',
    search: 'Search',
    more: 'Next >>',
    grub: 'Grub',
    list: 'List',
    info: 'Info',
    delete: 'Delete',
} as const;
export type Keys = typeof keys;

interface MediaAPI<T> {
    health(): Promise<boolean>;
    getMedia(): Promise<T[]>;
    getMedia(id: number): Promise<T>;
    search(text: string): Promise<T[]>;
    deleteMedia(id: number): Promise<boolean>;
    add(item: T, options?: any): Promise<boolean>;
}

export abstract class MediaChatHandler<T extends Series | Movie> extends ChatHandler<Keys> {
    abstract mark: string;
    abstract api: MediaAPI<T>;
    abstract displayMedia(media: T): string;
    abstract getMediaInfo(id: string | undefined): ActionResponse;
    abstract keyboard: KeyboardBuilder<Keys>;
    searchResults?: T[];

    actions: Actions<Keys> = {
        [keys.health]: async () => {
            const healthy = await this.updateProgress(this.api.health());
            return healthy ? '👌' : '😥';
        },
        [keys.search]: () => this.replayToSearch(),
        [keys.more]: (index) => this.displayNextSearch(index),
        [keys.grub]: (index) => this.grubCurrentMedia(index),
        [keys.list]: () => this.getAllMyMedia(),
        [keys.info]: (id) => this.getMediaInfo(id),
        [keys.delete]: (id) => this.deleteMedia(id),
    };

    replayToSearch() {
        this.handelText = (text) => {
            this.setDefaultTextHandling();
            return this.handelName(text);
        };

        return {
            message: 'Search for..?',
            markup: { force_reply: true as const },
        };
    }

    async handelName(text: string) {
        try {
            this.searchResults = await this.updateProgress(this.api.search(text));
            return this.displayNextSearch(-1);
        } catch (_) {
            return '😵';
        }
    }

    async handelId(id: number) {
        const media = await this.getMyMedia(id);
        return media
            ? {
                  message: this.displayMedia(media),
                  markup: this.keyboard([`${keys.info}:${media.id}`, `${keys.delete}:${media.id}`]),
              }
            : '🤷🏻‍♂';
    }

    async deleteMedia(id?: number | string) {
        id = Number(id);
        const media = await this.getMyMedia(id);
        if (!media?.id) {
            return 'Could not find this';
        }
        this.handelText = async (text) => {
            this.setDefaultTextHandling();
            if (text.toLowerCase() === 'yes') {
                const success = await this.api.deleteMedia(media.id!);
                return success ? '🆗' : 'Something went wrong😿';
            }
            return '🫶';
        };

        return {
            message: `Are you sure you want to delete "${media.title}"? (yes)`,
            markup: { force_reply: true as const },
        };
    }

    displayNextSearch(index?: string | number) {
        index = Number(index);
        const current = this.searchResults?.[++index];
        if (!current) {
            return 'No result to show';
        }
        const message = this.displayMedia(current);
        return {
            message,
            markup: this.keyboard([`${keys.more}:${index}`, current.id ? `${keys.info}:${current.id}` : `${keys.grub}:${index}`]),
        };
    }

    setDefaultTextHandling() {
        this.handelText = undefined;
    }

    public defaultHandleText = async (text: string) => {
        if (text.startsWith('/')) {
            const id = Number(text.slice(2));
            if (Number.isInteger(id)) {
                return this.handelId(id);
            }
            return '😕';
        }
        await bot.api.sendMessage(this.chatId, `Searching "${text}"...`);
        return this.handelName(text);
    };

    private grubCurrentMedia(index?: string | number) {
        index = Number(index);
        const current = this.searchResults?.[index];
        if (!current || current.id) {
            return current ? 'You already have that 👍' : 'cant found something to grub';
        }

        this.handelText = async (text) => {
            this.setDefaultTextHandling();

            if (text.toLowerCase() !== 'yes') {
                return '🤷🏻‍♂';
            }
            const res = await this.updateProgress(this.api.add(current));
            return res ? '👌' : '😿';
        };

        return {
            message: `Sure you want to add "${current.title}" to the library? (yes)`,
            markup: { force_reply: true as const },
        };
    }

    async getAllMyMedia() {
        try {
            const media = await this.updateProgress(this.api.getMedia());
            return media.map((s) => `${this.mark}${s.id} ${s.title}`).join('\n');
        } catch (error) {
            console.error(error);
            return '😓';
        }
    }

    async getMyMedia(id: number) {
        try {
            return await this.updateProgress(this.api.getMedia(id));
        } catch (error) {
            console.error(error);
            return undefined;
        }
    }
}
