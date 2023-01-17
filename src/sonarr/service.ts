import { Markup } from 'telegraf';
import * as api from './api';

export let waitingFor: ((text: string) => string) | undefined;
export const prefix = 'sonarr:';
const actions = {
    'ok?': async () => {
        return (await api.health()) ? '👌' : '😥';
    },
    'new show': async () => {
        waitingFor = (text) => {
            if (text.startsWith('f')) {
                waitingFor = undefined;
                return 'ok';
            }
            return 'false';
        };
        return 'what to search?';
    },
};

export const keyboard = Markup.inlineKeyboard(
    Object.keys(actions).map((key) => [
        { text: key, callback_data: prefix + key },
    ])
);

export async function handleAction(option: string) {
    const key = option.split(prefix)[1] as keyof typeof actions;
    return actions[key]?.();
}
