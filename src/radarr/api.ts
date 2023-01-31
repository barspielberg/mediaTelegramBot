import { config } from '../common/config.ts';
import { Http } from '../common/httpReq.ts';
import { Movie } from './models.ts';

const rootFolderPath = '/movies/';
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

export function getMyList(id: number): Promise<Movie>;
export function getMyList(): Promise<Movie[]>;
export function getMyList(id?: number) {
    return http.get(`/movie/${id ?? ''}`);
}

export function search(name: string): Promise<Movie[]> {
    return http.get<Movie[]>(`/movie/lookup?term=${name}`);
}

export async function deleteMovie(id: number) {
    try {
        await http.del(`/movie/${id}?deleteFiles=true`);
        return true;
    } catch (error) {
        console.error(error);
    }
    return false;
}

export function add(current: Movie): Promise<unknown> {
    throw new Error('Function not implemented.');
}
