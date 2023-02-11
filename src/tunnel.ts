import { config } from './common/config.ts';
import { InlineKeyboard, Composer, Context } from './pkg/grammy.ts';
import { Ngrok } from './pkg/ngrok.ts';

class MaxTunnelsError extends Error {}

interface Tunnel {
    url: string;
    destroy(): Promise<void>;
    addr: string;
}

class TunnelManager {
    private static _tunnel: Tunnel | undefined;

    public static get tunnel() {
        return this._tunnel;
    }

    private static async createTunnel(addr: string) {
        const process = Ngrok.create({ protocol: 'http', addr, authtoken: config.NGROK_KEY });

        const url = await new Promise<string>((res, rej) => {
            process.addEventListener('ready', (e) => {
                res('https://' + e.detail);
            });

            process.addEventListener('stderr', ({ detail }) => {
                console.error(detail);
                if (detail.startsWith('ERR')) {
                    rej(`ngrok error: ${detail}`);
                }
            });
        });

        return { url, destroy: () => process.destroy() };
    }

    static async getTunnel(addr: string) {
        if (!this._tunnel) {
            this._tunnel = Object.assign(await this.createTunnel(addr), { addr });
            return this._tunnel.url;
        }

        if (this._tunnel.addr === addr) {
            return this._tunnel.url;
        }

        throw new MaxTunnelsError();
    }

    static async destroyTunnel() {
        await this._tunnel?.destroy();
        this._tunnel = undefined;
    }
}

const prefix = 'tunnel';
const closeTunnelKey = 'closeTunnel';
const closeButton = ['Close it ❌', prefix + ':' + closeTunnelKey] as const;
const services = {
    sonarr: {
        name: 'Sonarr 📺',
        addr: config.SONARR_BASE_URL,
    },
    radarr: {
        name: 'Radarr 🍿',
        addr: config.RADARR_BASE_URL,
    },
} as const;

export const tunnelComposer = new Composer();

function replyNeedClose(ctx: Context) {
    ctx.reply('There is already an opened tunnel 🙀', {
        reply_markup: new InlineKeyboard().text(...closeButton),
    });
}

function replyOpened(ctx: Context, url: string) {
    ctx.reply('Tunnel opened ✨', {
        reply_markup: new InlineKeyboard().webApp('Take me 🤠', url).text(...closeButton),
    });
}

tunnelComposer.command('tunnel', (ctx) => {
    if (TunnelManager.tunnel) {
        replyNeedClose(ctx);
        return;
    }
    const buttons = Object.entries(services).map(([key, val]) => ({ text: val.name, callback_data: prefix + ':' + key }));
    ctx.reply('Create tunnel for:', {
        reply_markup: new InlineKeyboard([buttons]),
    });
});

tunnelComposer.on('callback_query:data', async (ctx, next) => {
    const { data } = ctx.callbackQuery;

    if (data.startsWith(prefix)) {
        const dataKey = data.split(':')[1];
        if (dataKey in services) {
            const addr = services[dataKey as keyof typeof services].addr;

            try {
                const url = await TunnelManager.getTunnel(addr);
                replyOpened(ctx, url);
            } catch (e) {
                if (!(e instanceof MaxTunnelsError)) {
                    throw e;
                }
                replyNeedClose(ctx);
            }
        }
        if (dataKey === closeTunnelKey) {
            await TunnelManager.destroyTunnel();
            ctx.reply('closed 😌');
        }
    }

    await next();
});
