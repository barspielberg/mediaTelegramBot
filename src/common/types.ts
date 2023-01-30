import { ForceReply, InlineKeyboardMarkup, ReplyKeyboardMarkup, ReplyKeyboardRemove } from '../pkg/grammy.ts';

export type TelegramRes = {
    message: string;
    markup?: InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply;
};

type Response = TelegramRes | string;

export type ActionResponse = Promise<Response> | Response;
