import { config } from '../config.ts';
import { AddOptions, Series } from './models.ts';

const baseURL = `${config.BASE_URL}:8989/api/v3`;
const key = config.SONARR_KEY;

const rootFolderPath = '/tv/';
const fetchTimeout = async (
    url: string,
    init?: RequestInit & { timeout?: number }
) => {
    const controller = new AbortController();
    const id = setTimeout(() => {
        controller.abort();
    }, init?.timeout ?? 5 * 1000);
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

async function get<T = unknown>(url: string) {
    const res = await fetchTimeout(url);
    const data: T = await res.json();
    return data;
}

async function post(url: string, payload: any) {
    const res = await fetchTimeout(url, {
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        body: JSON.stringify(payload),
    });
    return res;
}

export async function health() {
    try {
        await get(`${baseURL}/health`);
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

export function search(name: string) {
    return get<Series[]>(`${baseURL}/series/lookup?term=${name}`);
}

export async function add(
    series: Series,
    addOption: AddOptions = {
        searchForMissingEpisodes: true,
        searchForCutoffUnmetEpisodes: false,
        ignoreEpisodesWithFiles: false,
        ignoreEpisodesWithoutFiles: false,
        monitor: 'all',
    }
) {
    const { folder, ...rest } = series;
    const defaults = {
        alternateTitles: [],
        path: `${rootFolderPath}${folder}`,
        qualityProfileId: 6, //TODO add to options
        languageProfileId: 1,
        seasonFolder: true,
        rootFolderPath,
        added: new Date().toISOString(),
    };
    const payload = { ...rest, ...defaults, addOption };
    try {
        const res = await post(`${baseURL}/series/`, payload);
        if (res.ok && res.status === 201) {
            return true;
        }
        console.error(res);
    } catch (error) {
        console.error(error);
        return false;
    }

    return false;
}

export function getAllMy() {
    return get<Series[]>(`${baseURL}/series`);
}
