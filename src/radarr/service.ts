import { buildKeyboardBuilder, buildChatHandlerGetter, buildActionHandler, ChatHandler, Actions } from '../common/chatHandler.ts';
import * as api from './api.ts';

export const prefix = 'radarr:';

export const keys = {
    health: 'OK?',
    list: 'List',
} as const;
type Keys = typeof keys;

class RadarrChatHandler extends ChatHandler<Keys> {
    constructor(readonly chatId: number) {
        super(chatId);
    }
    actions: Actions<Keys> = {
        [keys.health]: async () => {
            const healthy = await this.updateProgress(api.health());
            return healthy ? '👌' : '😥';
        },
        [keys.list]: () => this.getMyMovies(),
    };

    private async getMyMovies() {
        try {
            const series = await this.updateProgress(api.getMyList());
            return series.map((s) => `/${s.id} ${s.title}`).join('\n');
        } catch (error) {
            console.error(error);
            return '😓';
        }
    }
}

export const keyboard = buildKeyboardBuilder<Keys>(prefix);
export const getChatHandler = buildChatHandlerGetter(RadarrChatHandler);
export const handleAction = buildActionHandler(getChatHandler);
