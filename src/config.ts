import './packages/dotenv.ts';

export const config = {
    BOT_TOKEN: Deno.env.get('BOT_TOKEN') ?? '',
    SONARR_KEY: Deno.env.get('SONARR_KEY') ?? '',
};
