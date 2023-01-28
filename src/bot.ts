import { config } from './config.ts';
import { Bot } from './pkg/grammy.ts';

export const bot = new Bot(config.BOT_TOKEN);
