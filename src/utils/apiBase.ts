/**
 * Build an API URL. When `VITE_API_BASE` is set (e.g. http://192.168.1.10:8787),
 * requests go there—useful when the frontend is opened from another device without
 * the Vite proxy. When empty, paths stay relative (`/api/...`) and the dev proxy applies.
 */
export function apiUrl(apiPath: string): string {
  const raw = import.meta.env.VITE_API_BASE as string | undefined;
  const base = typeof raw === 'string' ? raw.trim().replace(/\/$/, '') : '';
  const path = apiPath.startsWith('/') ? apiPath : `/${apiPath}`;
  return base ? `${base}${path}` : path;
}
