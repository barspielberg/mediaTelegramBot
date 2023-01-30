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
        const res = await http.post('/series/', payload);
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

export function getMyList(id: number): Promise<Series>;
export function getMyList(): Promise<Series[]>;
export function getMyList(id?: number) {
    return http.get(`/series/${id ?? ''}`);
}

export async function deleteSeries(id: number) {
    try {
        await http.del(`/series/${id}?deleteFiles=true`);
        return true;
    } catch (error) {
        console.error(error);
    }
    return false;
}
