import { useEffect, useState } from 'react';
import { apiUrl } from '@/utils/apiBase';
import { formatPHDate } from '../../utils/dateHelpers';

interface MonitoringRecord {
  id: number;
  site_name: string;
  barangay: string;
  monitoring_date: string;
  condition_status: string;
  survival_status: string;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  change: string;
  changePositive?: boolean;
  onClick?: () => void;
}

function StatCard({ icon, label, value, change, changePositive = true, onClick }: StatCardProps) {
  return (
    <div
      className={`bg-card rounded-lg p-6 shadow-sm border border-border transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-primary/30 hover:scale-[1.02]' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="size-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
          {icon}
        </div>
        <div className={`text-sm flex items-center gap-1 ${changePositive ? 'text-primary' : 'text-destructive'}`}>
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={changePositive ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"} />
          </svg>
          {change}
        </div>
      </div>
      <div className="space-y-1">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="text-3xl font-semibold text-foreground">{value}</div>
      </div>
    </div>
  );
}

export function DashboardOverview({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const today = formatPHDate(new Date());
  const [monitoringCount, setMonitoringCount] = useState<number>(0);
  const [monitoringRecords, setMonitoringRecords] = useState<MonitoringRecord[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);

  const getStatusTag = (status: string) => {
    const value = status.toLowerCase();
    if (value.includes('alive') || value.includes('surviving')) {
      return { label: 'Surviving', className: 'bg-emerald-100 text-emerald-700' };
    }
    if (value.includes('dead') || value.includes('not surviving')) {
      return { label: 'Not Surviving', className: 'bg-red-100 text-red-700' };
    }
    return { label: 'At Risk', className: 'bg-yellow-100 text-yellow-700' };
  };

  useEffect(() => {
    const fetchMonitoringSummary = async () => {
      setIsLoadingRecords(true);
      try {
        const response = await fetch(apiUrl('/api/monitoring/get-records.php'));
        if (!response.ok) {
          return;
        }
        const data = await response.json();
        if (Array.isArray(data.records)) {
          const records = [...data.records].sort((a, b) => {
            return new Date(b.monitoring_date).getTime() - new Date(a.monitoring_date).getTime();
          });
          setMonitoringCount(records.length);
          setMonitoringRecords(records);
        }
      } catch {
        // ignore fetch errors and keep fallback values
      } finally {
        setIsLoadingRecords(false);
      }
    };

    fetchMonitoringSummary();
  }, []);

  const survivingCount = monitoringRecords.filter((record) => {
    const value = record.survival_status?.toLowerCase() || record.condition_status?.toLowerCase();
    return value.includes('alive') || value.includes('surviving');
  }).length;
  const notSurvivingCount = monitoringRecords.filter((record) => {
    const value = record.survival_status?.toLowerCase() || record.condition_status?.toLowerCase();
    return value.includes('dead') || value.includes('not surviving');
  }).length;
  const atRiskCount = Math.max(0, monitoringRecords.length - survivingCount - notSurvivingCount);
  const progressPercent = monitoringRecords.length ? Math.round((survivingCount / monitoringRecords.length) * 100) : 0;
  const latestMonitoringRecord = monitoringRecords[0];
  const recentRecords = monitoringRecords.slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-foreground">Dashboard Overview</h1>
        <div className="text-xs text-muted-foreground sm:text-sm">
          <span className="inline-flex items-center gap-2">
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Panabo City, Philippines • {today}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={
            <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          }
          label="Total Mapped Areas"
          value="24"
          change="+2%"
          onClick={() => onNavigate?.('mapping')}
        />

        <StatCard
          icon={
            <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          }
          label="Mangrove Species"
          value="156"
          change="+8%"
          onClick={() => onNavigate?.('analytics')}
        />

        <StatCard
          icon={
            <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          label="Last monitoring date"
          value={latestMonitoringRecord?.monitoring_date || 'No records'}
          change="Live"
          onClick={() => onNavigate?.('monitoring')}
        />

        <StatCard
          icon={
            <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
          label="Conservation Projects"
          value={monitoringCount || '0'}
          change="+3%"
          onClick={() => onNavigate?.('monitoring')}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr,0.8fr] gap-6 mt-6">
        <div className="bg-card rounded-3xl border border-border p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Monitoring Progress</h2>
              <p className="text-sm text-muted-foreground">Track survival and recent record activity across planted sites.</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate?.('monitoring')}
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
            >
              View all
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.9fr,1.4fr] items-center">
            <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-background p-6 text-center">
              <div className="relative mb-6 h-48 w-48">
                <svg viewBox="0 0 120 120" className="h-full w-full">
                  <circle cx="60" cy="60" r="48" stroke="#e5e7eb" strokeWidth="12" fill="none" />
                  <circle
                    cx="60"
                    cy="60"
                    r="48"
                    stroke="#10b981"
                    strokeWidth="12"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray="301.44"
                    strokeDashoffset={301.44 - (301.44 * progressPercent) / 100}
                    transform="rotate(-90 60 60)"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-4xl font-semibold text-foreground">{progressPercent}%</div>
                  <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Overall progress</div>
                </div>
              </div>
              <div className="flex flex-col gap-2 text-sm text-foreground">
                <div className="font-semibold">{survivingCount} Surviving</div>
                <div className="text-muted-foreground">{atRiskCount} At Risk</div>
                <div className="text-muted-foreground">{notSurvivingCount} Not Surviving</div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-border bg-background p-5">
                <div className="text-sm text-muted-foreground">Overall Progress</div>
                <div className="mt-3 text-3xl font-semibold">{progressPercent}%</div>
                <div className="mt-2 text-xs text-muted-foreground">Surviving plants compared to all monitored records.</div>
              </div>
              <div className="rounded-3xl border border-border bg-background p-5">
                <div className="text-sm text-muted-foreground">Monitoring Records</div>
                <div className="mt-3 text-3xl font-semibold">{monitoringCount}</div>
                <div className="mt-2 text-xs text-muted-foreground">Records updated most recently.</div>
              </div>
              <div className="rounded-3xl border border-border bg-background p-5">
                <div className="text-sm text-muted-foreground">At Risk</div>
                <div className="mt-3 text-3xl font-semibold">{atRiskCount}</div>
                <div className="mt-2 text-xs text-muted-foreground">Requires follow-up action.</div>
              </div>
              <div className="rounded-3xl border border-border bg-background p-5">
                <div className="text-sm text-muted-foreground">Not Surviving</div>
                <div className="mt-3 text-3xl font-semibold">{notSurvivingCount}</div>
                <div className="mt-2 text-xs text-muted-foreground">Records that need review.</div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-border bg-background p-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Surviving</span>
                <span>{monitoringRecords.length ? `${Math.round((survivingCount / monitoringRecords.length) * 100)}%` : '0%'}</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-emerald-200">
                <div className="h-2 rounded-full bg-emerald-600" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
            <div className="rounded-3xl border border-border bg-background p-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>At Risk</span>
                <span>{monitoringRecords.length ? `${Math.round((atRiskCount / monitoringRecords.length) * 100)}%` : '0%'}</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-yellow-200">
                <div className="h-2 rounded-full bg-yellow-500" style={{ width: `${monitoringRecords.length ? (atRiskCount / monitoringRecords.length) * 100 : 0}%` }} />
              </div>
            </div>
            <div className="rounded-3xl border border-border bg-background p-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Not Surviving</span>
                <span>{monitoringRecords.length ? `${Math.round((notSurvivingCount / monitoringRecords.length) * 100)}%` : '0%'}</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-red-200">
                <div className="h-2 rounded-full bg-red-600" style={{ width: `${monitoringRecords.length ? (notSurvivingCount / monitoringRecords.length) * 100 : 0}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-3xl border border-border p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Recent Monitoring Records</h2>
              <p className="text-sm text-muted-foreground">Latest entries from the monitoring activity feed.</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate?.('monitoring')}
              className="text-sm font-semibold text-primary hover:underline"
            >
              View all
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[460px] text-left text-sm">
              <thead className="bg-secondary/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Site Name</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoadingRecords ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-sm text-muted-foreground">Loading records...</td>
                  </tr>
                ) : recentRecords.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-sm text-muted-foreground">No recent monitoring records available.</td>
                  </tr>
                ) : (
                  recentRecords.map((record) => {
                    const tag = getStatusTag(record.survival_status || record.condition_status || 'At Risk');
                    return (
                      <tr key={record.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="px-4 py-4 font-medium text-foreground">{record.site_name}</td>
                        <td className="px-4 py-4 text-muted-foreground">{formatPHDate(new Date(record.monitoring_date).toISOString())}</td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tag.className}`}>{tag.label}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
