import { config } from '../config.ts';
import { Series } from './models.ts';

const baseURL = 'http://10.0.0.55:8989/api/v3';
const key = config.SONARR_KEY;

const fetchTimeout = async (
    url: string,
    init: RequestInit & { timeout: number }
) => {
    const controller = new AbortController();
    const id = setTimeout(() => {
        controller.abort();
    }, init.timeout);
    try {
        return await fetch(url, {
            ...init,
            signal: controller.signal,
            headers: { ['x-api-key']: key },
        });
    } finally {
        clearTimeout(id);
    }
};

export async function health() {
    try {
        await fetchTimeout(baseURL + '/health', { timeout: 5 * 1000 });
        return true;
    } catch (_) {
        return false;
    }
}

export async function search(name: string) {
    const res = await fetchTimeout(`${baseURL}/series/lookup?term=${name}`, {
        timeout: 5 * 1000,
    });
    const data: Series[] = await res.json();
    return data;
}
