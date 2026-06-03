import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { apiUrl } from '@/utils/apiBase';

type StatusPayload = {
  app?: string;
  php_version?: string;
  server_time_utc?: string;
  database?: {
    connected?: boolean;
    name?: string;
    host?: string;
    port?: number;
    mysql_version?: string | null;
    error?: string | null;
  };
  smtp_configured?: boolean;
  google_oauth_backend_configured?: boolean;
  message?: string;
};

function StatusRow({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 py-3 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={`text-sm font-medium text-right break-all ${ok === true ? 'text-emerald-700' : ok === false ? 'text-destructive' : 'text-foreground'}`}
      >
        {value}
      </span>
    </div>
  );
}

export function SystemStatusPage({ onBack }: { onBack: () => void }) {
  const [data, setData] = useState<StatusPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const apiBaseHint = (import.meta.env.VITE_API_BASE as string | undefined)?.trim() || '(same origin / Vite proxy)';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const res = await fetch(apiUrl('/api/system/status.php'));
        const json = (await res.json()) as StatusPayload;
        if (!res.ok) {
          throw new Error(json.message || `HTTP ${res.status}`);
        }
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) {
          setLoadError('Could not reach the API. Start PHP from backend/public (see README) and check VITE_API_BASE if you are not using the Vite dev server.');
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const db = data?.database;

  return (
    <div className="relative min-h-full w-full flex items-center justify-center px-6 py-10 bg-background">
      <div
        className="absolute inset-0 hidden lg:block bg-cover bg-center opacity-40"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1767917654279-dfeea8500862?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600')",
        }}
      />
      <div className="absolute inset-0 hidden lg:block bg-background/75" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-lg"
      >
        <div className="bg-card border border-border rounded-xl shadow-lg p-8 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-foreground">Backend status</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Use this from any device on your network to confirm the API and database. No passwords are shown.
              </p>
            </div>
            <button
              type="button"
              onClick={onBack}
              className="shrink-0 text-sm text-primary hover:underline"
            >
              Back to login
            </button>
          </div>

          <div className="rounded-lg bg-muted/50 px-4 py-3 text-xs text-muted-foreground space-y-1">
            <div>
              <span className="font-medium text-foreground">This page URL: </span>
              {typeof window !== 'undefined' ? window.location.href : ''}
            </div>
            <div>
              <span className="font-medium text-foreground">VITE_API_BASE: </span>
              {apiBaseHint}
            </div>
          </div>

          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {loadError && <p className="text-sm text-destructive">{loadError}</p>}

          {data && (
            <div className="space-y-1">
              <StatusRow label="API" value={data.app || 'LeoWorks API'} />
              <StatusRow label="PHP" value={data.php_version || '—'} />
              <StatusRow label="Server time (UTC)" value={data.server_time_utc || '—'} />
              <StatusRow
                label="MySQL"
                value={
                  db?.connected
                    ? db.mysql_version || 'Connected'
                    : db?.error || 'Not connected'
                }
                ok={db?.connected === true ? true : db?.connected === false ? false : undefined}
              />
              {db?.connected && (
                <>
                  <StatusRow label="Database name" value={db.name || '—'} />
                  <StatusRow label="DB host:port" value={`${db.host || '—'}:${db.port ?? ''}`} />
                </>
              )}
              <StatusRow
                label="SMTP (email codes)"
                value={data.smtp_configured ? 'Configured' : 'Not configured'}
                ok={data.smtp_configured === true ? true : data.smtp_configured === false ? false : undefined}
              />
              <StatusRow
                label="Google OAuth (backend)"
                value={data.google_oauth_backend_configured ? 'Client ID set' : 'Missing client ID'}
                ok={
                  data.google_oauth_backend_configured === true
                    ? true
                    : data.google_oauth_backend_configured === false
                      ? false
                      : undefined
                }
              />
            </div>
          )}

          <p className="text-xs text-muted-foreground leading-relaxed">
            On another device, open the <strong>Network</strong> URL from <code className="text-foreground">npm run dev</code>
            , or set <code className="text-foreground">VITE_API_BASE</code> to your PC&apos;s API URL (e.g.{' '}
            <code className="text-foreground">http://192.168.x.x:8787</code>) and run PHP with{' '}
            <code className="text-foreground">php -S 0.0.0.0:8787</code> if the browser talks to the API directly.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
