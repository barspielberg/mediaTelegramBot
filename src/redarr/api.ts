import { config } from '../common/config.ts';
import { Http } from '../common/httpReq.ts';

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
