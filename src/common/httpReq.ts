export class Http {
    key = '';
    timeout = 5 * 1000;
    baseUrl = '';

    private async fetchTimeout(url: string, init?: RequestInit) {
        const controller = new AbortController();
        const id = setTimeout(() => {
            controller.abort();
        }, this.timeout);
        try {
            const res = await fetch(url, {
                ...init,
                signal: controller.signal,
                headers: { ['x-api-key']: this.key, ...init?.headers },
            });
            if (!res.ok) {
                const err = new Error(res.statusText);
                throw Object.assign(err, { status: res.status });
            }
            return res;
        } finally {
            clearTimeout(id);
        }
    }

    async get<T = unknown>(url: string) {
        const res = await this.fetchTimeout(this.baseUrl + url);
        const data: T = await res.json();
        return data;
    }

    async post(url: string, payload: any, headers: Record<string, string> = { 'Content-Type': 'application/json' }) {
        const res = await this.fetchTimeout(this.baseUrl + url, {
            headers,
            method: 'POST',
            body: JSON.stringify(payload),
        });
        return res;
    }

    del(url: string) {
        return this.fetchTimeout(this.baseUrl + url, { method: 'DELETE' });
    }
}
