import { formatFileSize } from '../common/utils.ts';
import { Series } from './Series.ts';
import * as sonarrApi from './sonarrApi.ts';
import {
    buildActionHandler,
    buildChatHandlerGetter,
    buildKeyboardBuilder,
    MediaChatHandler,
} from '../common/mediaChatHandler.ts';
import { config } from '../common/config.ts';

const tz = config.TIMEZONE;
export const prefix = 'sonarr:';
export const mark = '/S';

class SonarrChatHandler extends MediaChatHandler<Series> {
    mark = mark;
    api = sonarrApi;
    keyboard = keyboard;

    displayMedia(s: Series) {
        let res = `${s.id ? '✅' : ''} ${s.title} ${s.year || ''} `;
        res += '\n';
        if (s.imdbId) {
            res += `\nhttps://www.imdb.com/title/${s.imdbId}`;
        } else if (s.remotePoster) {
            res += `\n${s.remotePoster}`;
        }
        return res;
    }

    async getMediaInfo(id?: number | string) {
        id = Number(id);
        const series = await this.getMyMedia(id);

        const seasonData = series?.seasons.map((s) => ` - Season ${s.seasonNumber} ${s.monitored ? '🧐' : '🙈'}\n`).join('');

        let info = `Status: ${series?.status}\n`;
        info += `Network: ${series?.network}\n`;
        info += series?.monitored ? 'Monitored:\n' + seasonData : `Not monitored 🙈\n`;
        info += '\n';
        info += `Episodes: ${series?.statistics.episodeCount} / ${series?.statistics.totalEpisodeCount}\n`;
        info += `${formatFileSize(series?.statistics.sizeOnDisk)} (${series?.statistics.episodeFileCount} episode files)\n`;
        info += '\n';
        info += series?.nextAiring ? `Next airing: ${new Date(series.nextAiring).toLocaleString(tz)}\n` : '';
        info += series?.previousAiring ? `Previous airing: ${new Date(series.previousAiring).toLocaleString(tz)}\n` : '';

        return series ? info : '🤷🏻‍♂';
    }
}

export const keyboard = buildKeyboardBuilder(prefix);
export const getChatHandler = buildChatHandlerGetter(SonarrChatHandler);
export const handleAction = buildActionHandler(getChatHandler);
