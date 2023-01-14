const baseURL = 'http://10.0.0.55:8989/api/v3';

export async function health() {
    try {
        await fetch(baseURL + '/health');
        return true;
    } catch (error) {
        return false;
    }
}
