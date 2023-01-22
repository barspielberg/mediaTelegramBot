import { InlineKeyboard, ReplyMessage } from '../packages/grammy.ts';
import * as api from './api.ts';
import { Series } from './models.ts';

type Response = {
    message: string;
    markup?: ReplyMessage['reply_markup'];
};

export const prefix = 'sonarr:';

export const chatHandlers: Record<number, ChatHandler> = {};

const seriesInPage = 5;

function displaySeries(se: Series[]) {
    return se.map((s) => s.title).join(', ');
}

const keys = {
    health: 'ok?',
    search: 'new show',
    more: 'more?',
} as const;

type Action = typeof keys[keyof typeof keys];

type ActionResponse = Promise<Response | undefined> | Response | undefined;

class ChatHandler {
    handelText?: (text: string) => Promise<Response>;
    currentSearch?: Series[];

    actions: Record<Action, () => ActionResponse> = {
        [keys.health]: async () => {
            return { message: (await api.health()) ? '👌' : '😥' };
        },
        [keys.search]: () => {
            this.handelText = this.waitForShowName;
            return { message: 'what to search?' };
        },
        [keys.more]: () => this.replaySearchResult(),
    };

    private waitForShowName = async (text: string) => {
        this.stopWaiting();
        try {
            this.currentSearch = await api.search(text);
            return this.replaySearchResult();
        } catch (_) {
            return { message: '😵' };
        }
    };

    private replaySearchResult() {
        const current = this.getNextSearch();
        if (!current || current?.length <= 0) {
            return { message: 'no result to show' };
        }
        return {
            message: displaySeries(current),
            markup: keyboard([keys.more]),
        };
    }

    private getNextSearch() {
        const { currentSearch } = this;
        console.log('current', currentSearch?.length);

        if (!currentSearch) {
            return undefined;
        }
        this.currentSearch = currentSearch.slice(seriesInPage);
        return currentSearch.slice(0, seriesInPage);
    }

    private stopWaiting() {
        this.handelText = undefined;
    }
}

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
    chatHandlers[chatId] ??= new ChatHandler();
    return chatHandlers[chatId].actions[key]?.();
}
