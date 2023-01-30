import { ActionResponse } from '../common/types.ts';
import { updateLongProcess } from '../common/utils.ts';
import { InlineKeyboard } from '../pkg/grammy.ts';
import * as api from './api.ts';

export const prefix = 'radarr:';

const chatHandlers: Record<number, ChatHandler> = {};

export const keys = {
    health: 'OK?',
};

type Action = typeof keys[keyof typeof keys];

class ChatHandler {
    handelText?: (text: string) => ActionResponse;

    constructor(private readonly chatId: number) {}
    actions: Record<Action, (data?: string) => ActionResponse> = {
        [keys.health]: async () => {
            const healthy = await this.updateProgress(api.health());
            return healthy ? '👌' : '😥';
        },
    };

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
