import { buildKeyboardBuilder, buildChatHandlerGetter, buildActionHandler } from '../common/chatHandler.ts';
import { config } from '../common/config.ts';
import { Keys, MediaChatHandler } from '../common/mediaChatHandler.ts';
import { formatFileSize } from '../common/utils.ts';
import * as api from './api.ts';
import { Movie } from './models.ts';

const tz = config.TIMEZONE;
export const prefix = 'radarr:';
export const mark = '/M';

class RadarrChatHandler extends MediaChatHandler<Movie> {
    mark = mark;
    api = api;
    keyboard = keyboard;

    displayMedia(m: Movie) {
        const { id, title, imdbId, remotePoster, inCinemas, runtime } = m;
        let res = `${id ? '✅' : ''} ${title} - `;
        res += inCinemas ? new Date(inCinemas).toLocaleDateString(tz) : '';
        res += '\n';
        res += runtime ? `\n${runtime}min` : '';
        res += '\n\n';
        res += imdbId ? `https://www.imdb.com/title/${imdbId}` : remotePoster ? remotePoster : '';
        return res;
    }

    async getMediaInfo(id?: number | string) {
        id = Number(id);
        const movie = await this.getMyMedia(id);

        let info = `Status: ${movie?.status}\n`;
        info += `Studio: ${movie?.studio}\n\n`;
        info += `Physical release: ${
            movie?.physicalRelease ? new Date(movie.physicalRelease).toLocaleDateString(tz) : '🤷🏻‍♂'
        }\n\n`;
        info += `Monitored: ${movie?.monitored ? '👍' : '👎'}\n`;
        info += `Available: ${movie?.isAvailable ? '👍' : '👎'}\n\n`;
        info += `${formatFileSize(movie?.sizeOnDisk)}\n`;

        return movie ? info : '🤷🏻‍♂';
    }
}

export const keyboard = buildKeyboardBuilder<Keys>(prefix);
export const getChatHandler = buildChatHandlerGetter(RadarrChatHandler);
export const handleAction = buildActionHandler(getChatHandler);
