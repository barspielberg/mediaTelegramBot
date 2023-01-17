import * as dotenv from 'dotenv';

dotenv.config();

export const config = {
    BOT_TOKEN: process.env.BOT_TOKEN ?? '',
    SONARR_KEY: process.env.SONARR_KEY ?? '',
};
