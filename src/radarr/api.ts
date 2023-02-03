import { config } from '../common/config.ts';
import { Http } from '../common/httpReq.ts';
import { Movie } from './models.ts';

const rootFolderPath = '/movies';
const http = new Http();

http.key = config.RADARR_KEY;
http.baseUrl = `${config.BASE_URL}:7878/api/v3`;

export async function health() {
    try {
        await http.get('/health');
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

export function getMedia(id: number): Promise<Movie>;
export function getMedia(): Promise<Movie[]>;
export function getMedia(id?: number) {
    return http.get(`/movie/${id ?? ''}`);
}

export function search(name: string): Promise<Movie[]> {
    return http.get<Movie[]>(`/movie/lookup?term=${name}`);
}

export async function deleteMedia(id: number) {
    try {
        await http.del(`/movie/${id}?deleteFiles=true`);
        return true;
    } catch (error) {
        console.error(error);
    }
    return false;
}

export async function add(
    movie: Movie,
    addOptions = {
        monitor: 'movieOnly',
        searchForMovie: true,
    }
) {
    const defaults = {
        id: 0,
        qualityProfileId: 6,
        rootFolderPath,
        minimumAvailability: 'released',
        monitored: true,
    };
    const payload = { ...movie, addOptions, ...defaults };
    try {
        const res = await http.post('/movie/', payload, {
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
