import * as api from './api';

export const options = ['ok?'] as const;
type Option = typeof options[number];

export async function handleAction(option: Option) {
    switch (option) {
        case 'ok?':
            return (await api.health()) ? '👌' : '😥';
        default:
            break;
    }
}
