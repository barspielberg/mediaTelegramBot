import '../pkg/dotenv.ts';

export const config = {
    BOT_TOKEN: Deno.env.get('BOT_TOKEN') ?? '',
    SONARR_KEY: Deno.env.get('SONARR_KEY') ?? '',
    RADARR_KEY: Deno.env.get('RADARR_KEY') ?? '',
    SONARR_BASE_URL: Deno.env.get('SONARR_BASE_URL') ?? '',
    RADARR_BASE_URL: Deno.env.get('RADARR_BASE_URL') ?? '',
    ALLOWED_CHATS: Deno.env.get('ALLOWED_CHATS') ?? '',
    TIMEZONE: Deno.env.get('TIMEZONE'),
    NGROK_KEY: Deno.env.get('NGROK_KEY'),
};
