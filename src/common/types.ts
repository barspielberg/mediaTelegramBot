import { ForceReply, InlineKeyboardMarkup, ReplyKeyboardMarkup, ReplyKeyboardRemove } from '../pkg/grammy.ts';

export type TelegramRes = {
    message: string;
    markup?: InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply;
};

type Response = TelegramRes | string;

export type ActionResponse = Promise<Response> | Response;

export type ValueOf<T> = T[keyof T];

type Keys = Readonly<Record<string, string>>;

export type Actions<T extends Keys> = Record<ValueOf<T>, (data?: string) => ActionResponse>;
