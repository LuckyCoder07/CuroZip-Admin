// Central API helper for fetch (Vite)
export const API_URL = import.meta.env.VITE_API_URL;

/**
 * apiFetch(path, options)
 * path must start with / (e.g. '/api/login')
 */
export async function apiFetch(path, options = {}) {
    const url = `${API_URL}${path}`;
    const opts = {
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        ...options,
    };
    const res = await fetch(url, opts);
    if (!res.ok) {
        const text = await res.text().catch(() => null);
        const err = new Error(res.statusText || 'API error');
        err.status = res.status;
        err.body = text;
        throw err;
    }
    const ct = res.headers.get('content-type') || '';
    return ct.includes('application/json') ? res.json() : res.text();
}