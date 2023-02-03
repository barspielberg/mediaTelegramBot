import { InlineKeyboard } from '../pkg/grammy.ts';
import { ActionResponse } from './types.ts';
import { updateLongProcess } from './utils.ts';

type ValueOf<T> = T[keyof T];

type Keys = Readonly<Record<string, string>>;

export type Actions<T extends Keys> = Record<ValueOf<T>, (data?: string) => ActionResponse>;

export abstract class ChatHandler<T extends Keys> {
    handelText?: (text: string) => ActionResponse;
    abstract defaultHandleText: (text: string) => ActionResponse;

    constructor(readonly chatId: number) {}

    abstract actions: Actions<T>;

    protected updateProgress<T>(promise: Promise<T>) {
        return updateLongProcess(this.chatId, promise);
    }
}

export type KeyboardBuilder<T extends Keys> = (actions: (ValueOf<T> | `${ValueOf<T>}:${string}`)[]) => InlineKeyboard;

export function buildKeyboardBuilder<T extends Keys>(prefix: string): KeyboardBuilder<T> {
    return function (actions: (ValueOf<T> | `${ValueOf<T>}:${string}`)[]) {
        return new InlineKeyboard([
            actions.map((key) => ({
                text: key.split(':')[0],
                callback_data: prefix + key,
            })),
        ]);
    };
}

export function buildChatHandlerGetter<K extends Keys>(handler: { new (chatId: number): ChatHandler<K> }) {
    const chatHandlers: Record<number, ChatHandler<K>> = {};
    return function (chatId: number) {
        chatHandlers[chatId] ??= new handler(chatId);
        return chatHandlers[chatId];
    };
}
export function buildActionHandler<K extends Keys>(getter: (chatId: number) => ChatHandler<K>) {
    return function (option: string, chatId?: number) {
        const [_, key, data] = option.split(':') as [string, ValueOf<K>, string | undefined];
        if (!chatId) {
            return;
        }
        return getter(chatId).actions[key]?.(data);
    };
}
