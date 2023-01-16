const baseURL = 'http://10.0.0.55:8989/api/v3';

const fetchTimeout = async (
    url: string,
    init: RequestInit & { timeout: number }
) => {
    const controller = new AbortController();
    const id = setTimeout(() => {
        controller.abort();
    }, init.timeout);
    try {
        return await fetch(url, { ...init, signal: controller.signal });
    } finally {
        clearTimeout(id);
    }
};

export async function health() {
    try {
        await fetchTimeout(baseURL + '/health', { timeout: 5 * 1000 });
        return true;
    } catch (error) {
        return false;
    }
}
