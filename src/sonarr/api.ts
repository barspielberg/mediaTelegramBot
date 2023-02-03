import { Http } from '../common/httpReq.ts';
import { config } from '../common/config.ts';
import { AddOptions, Series } from './models.ts';

const rootFolderPath = '/tv/';
const http = new Http();

http.key = config.SONARR_KEY;
http.baseUrl = `${config.BASE_URL}:8989/api/v3`;

export async function health() {
    try {
        await http.get('/health');
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

export function search(name: string) {
    return http.get<Series[]>(`/series/lookup?term=${name}`);
}

export async function add(
    series: Series,
    addOptions: AddOptions = {
        searchForMissingEpisodes: true,
        searchForCutoffUnmetEpisodes: false,
        monitor: 'all',
    }
) {
    const defaults = {
        qualityProfileId: 6, //TODO add to options
        languageProfileId: 1,
        seasonFolder: true,
        rootFolderPath,
        monitored: true,
    };
    const payload = { ...series, ...defaults, addOptions };
    try {
        const res = await http.post('/series/', payload, {
            'Content-Encoding': 'gzip',
            'Content-Type': 'application/json; charset=utf-8',
        });
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

export function getMedia(id: number): Promise<Series>;
export function getMedia(): Promise<Series[]>;
export function getMedia(id?: number) {
    return http.get(`/series/${id ?? ''}`);
}

export async function deleteMedia(id: number) {
    try {
        await http.del(`/series/${id}?deleteFiles=true`);
        return true;
    } catch (error) {
        console.error(error);
    }
    return false;
}
