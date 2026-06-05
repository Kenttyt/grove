import { useEffect, useMemo, useState } from 'react';
import { apiUrl } from '@/utils/apiBase';
import { formatPHDate, formatPHDateShort } from '../../utils/dateHelpers';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';

interface MonitoringRecord {
  id: number;
  site_name: string;
  barangay: string;
  latitude: string;
  longitude: string;
  species: string;
  date_planted: string;
  planting_method: string;
  number_seedlings: string;
  monitoring_date: string;
  condition_status: string;
  current_height_cm: string;
  survival_status: string;
  remarks: string;
  photo_path: string;
  status: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  Surviving: '#22c55e',
  'At Risk': '#f59e0b',
  'Not Surviving': '#ef4444',
  Unknown: '#94a3b8',
};

const speciesPalette = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#0ea5e9'];

export function AnalyticsDashboard() {
  const today = formatPHDate(new Date());
  const [records, setRecords] = useState<MonitoringRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const response = await fetch(apiUrl('/api/monitoring/get-records.php'));
        if (!response.ok) {
          throw new Error('Failed to load monitoring records.');
        }
        const data = await response.json();
        setRecords(Array.isArray(data.records) ? data.records : []);
      } catch (err) {
        setError('Unable to load analytics data.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, []);

  const totalRecords = records.length;

  const speciesCounts = useMemo(() => {
    return records.reduce<Record<string, number>>((acc, record) => {
      const key = record.species?.trim() || 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [records]);

  const survivalCounts = useMemo(() => {
    return records.reduce<Record<string, number>>((acc, record) => {
      const status = record.survival_status?.trim() || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
  }, [records]);

  const recordsOverTime = useMemo(() => {
    const grouped: Record<string, { date: string; count: number }> = {};
    records.forEach((record) => {
      const isoDate = record.monitoring_date || record.date_planted || record.created_at || '';
      if (!isoDate) return;
      const dateKey = isoDate.slice(0, 10);
      grouped[dateKey] = grouped[dateKey] || { date: dateKey, count: 0 };
      grouped[dateKey].count += 1;
    });

    return Object.values(grouped)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((item) => ({ date: formatPHDateShort(item.date), count: item.count }));
  }, [records]);

  const speciesDistributionData = useMemo(() => {
    const sorted = Object.entries(speciesCounts).sort(([, a], [, b]) => b - a);
    const top = sorted.slice(0, 4).map(([name, value]) => ({ name, value }));
    const othersCount = sorted.slice(4).reduce((sum, [, value]) => sum + value, 0);
    if (othersCount > 0) {
      top.push({ name: 'Others', value: othersCount });
    }
    return top;
  }, [speciesCounts]);

  const statusDistributionData = useMemo(() => {
    const keys = ['Surviving', 'At Risk', 'Not Surviving', 'Unknown'];
    return keys
      .filter((key) => survivalCounts[key])
      .map((key) => ({ name: key, value: survivalCounts[key] }));
  }, [survivalCounts]);

  const survivingRate = totalRecords
    ? Math.round((100 * (survivalCounts['Surviving'] || 0)) / totalRecords)
    : 0;

  const atRiskRate = totalRecords
    ? Math.round((100 * (survivalCounts['At Risk'] || 0)) / totalRecords)
    : 0;

  const notSurvivingRate = totalRecords
    ? Math.round((100 * (survivalCounts['Not Surviving'] || 0)) / totalRecords)
    : 0;

  const totalSpecies = Object.keys(speciesCounts).length;
  const averageSeedlings = totalRecords
    ? Math.round(
        records.reduce((sum, record) => sum + Number(record.number_seedlings || 0), 0) / totalRecords,
      )
    : 0;

  const topSpecies = Object.entries(speciesCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([name]) => name)[0] || 'None yet';

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1>Analytics</h1>
            <p className="text-muted-foreground">Insights and data analysis for mangrove conservation</p>
          </div>
          <div className="text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Panabo City, Philippines • {today}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="bg-card rounded-3xl border border-border p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Survival Rate Overview</h2>
              <p className="text-sm text-muted-foreground">Current survival breakdown from published records.</p>
            </div>
            <div className="size-10 rounded-2xl bg-primary/10 text-primary grid place-items-center">
              <span className="text-sm font-semibold">{totalRecords}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr,0.8fr]">
            <div className="space-y-4">
              <div className="rounded-3xl border border-border bg-background p-4">
                <div className="text-sm text-muted-foreground">Surviving</div>
                <div className="mt-2 text-2xl font-semibold text-foreground">{survivingRate}%</div>
              </div>
              <div className="rounded-3xl border border-border bg-background p-4">
                <div className="text-sm text-muted-foreground">At Risk</div>
                <div className="mt-2 text-2xl font-semibold text-amber-600">{atRiskRate}%</div>
              </div>
              <div className="rounded-3xl border border-border bg-background p-4">
                <div className="text-sm text-muted-foreground">Not Surviving</div>
                <div className="mt-2 text-2xl font-semibold text-destructive">{notSurvivingRate}%</div>
              </div>
            </div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Surviving', value: survivalCounts['Surviving'] || 0 },
                      { name: 'At Risk', value: survivalCounts['At Risk'] || 0 },
                      { name: 'Not Surviving', value: survivalCounts['Not Surviving'] || 0 },
                      { name: 'Unknown', value: survivalCounts['Unknown'] || 0 },
                    ]}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={36}
                    outerRadius={64}
                    paddingAngle={2}
                  >
                    {Object.entries(statusColors).map(([name, color]) => (
                      <Cell key={name} fill={color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-3xl border border-border p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Records Over Time</h2>
              <p className="text-sm text-muted-foreground">Published monitoring count by date.</p>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {recordsOverTime.length} dates
            </span>
          </div>
          <div className="h-64">
            {loading ? (
              <div className="grid h-full place-items-center text-sm text-muted-foreground">Loading charts…</div>
            ) : recordsOverTime.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={recordsOverTime} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center text-sm text-muted-foreground">No monitoring dates available yet.</div>
            )}
          </div>
        </div>

        <div className="bg-card rounded-3xl border border-border p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Species Distribution</h2>
              <p className="text-sm text-muted-foreground">Species share across published records.</p>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {totalSpecies} species
            </span>
          </div>
          <div className="h-64">
            {loading ? (
              <div className="grid h-full place-items-center text-sm text-muted-foreground">Loading chart…</div>
            ) : speciesDistributionData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={speciesDistributionData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    outerRadius={72}
                    labelLine={false}
                    label={false}
                  >
                    {speciesDistributionData.map((entry, index) => (
                      <Cell key={entry.name} fill={speciesPalette[index % speciesPalette.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center text-sm text-muted-foreground">No species data available yet.</div>
            )}
          </div>
          <div className="mt-4 space-y-3 text-sm">
            {speciesDistributionData.slice(0, 4).map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <span className="text-muted-foreground">{item.name}</span>
                <span className="font-medium">{Math.round((item.value / totalRecords) * 100)}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-3xl border border-border p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Status Distribution</h2>
              <p className="text-sm text-muted-foreground">Monitoring status counts by survival state.</p>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {totalRecords} records
            </span>
          </div>
          <div className="h-64">
            {loading ? (
              <div className="grid h-full place-items-center text-sm text-muted-foreground">Loading chart…</div>
            ) : statusDistributionData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusDistributionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {statusDistributionData.map((entry) => (
                      <Cell key={entry.name} fill={statusColors[entry.name] || '#cbd5e1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center text-sm text-muted-foreground">No status data available yet.</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-card rounded-3xl border border-border p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Core analytics</h3>
            <p className="text-sm text-muted-foreground">Live numbers pulled from published monitoring records.</p>
          </div>
          <div className="space-y-4 text-sm text-foreground">
            <div className="flex items-center justify-between rounded-3xl border border-border bg-background p-4">
              <div>
                <p className="text-muted-foreground">Average seedlings per record</p>
                <p className="mt-1 text-lg font-semibold">{averageSeedlings}</p>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-3xl border border-border bg-background p-4">
              <div>
                <p className="text-muted-foreground">Top species</p>
                <p className="mt-1 text-lg font-semibold">{topSpecies}</p>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-3xl border border-border bg-background p-4">
              <div>
                <p className="text-muted-foreground">Published records</p>
                <p className="mt-1 text-lg font-semibold">{totalRecords}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-3xl border border-border p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Data health</h3>
            <p className="text-sm text-muted-foreground">Ensure the analytics view is up to date with monitoring entries.</p>
          </div>
          <div className="space-y-4 text-sm text-foreground">
            <div className="rounded-3xl border border-border bg-background p-4">
              <div className="text-muted-foreground text-xs uppercase tracking-[0.18em]">Latest monitoring</div>
              <div className="mt-2 font-semibold">{records[0]?.monitoring_date ? formatPHDate(records[0].monitoring_date) : 'No records'}</div>
            </div>
            <div className="rounded-3xl border border-border bg-background p-4">
              <div className="text-muted-foreground text-xs uppercase tracking-[0.18em]">Species count</div>
              <div className="mt-2 font-semibold">{totalSpecies}</div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-3xl border border-border p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Recommended actions</h3>
            <p className="text-sm text-muted-foreground">Suggestions based on the latest analytics.
            </p>
          </div>
          <div className="space-y-2 text-sm text-foreground">
            <p>• Focus review on recent records marked “At Risk” or “Not Surviving”.</p>
            <p>• Keep all planting sites updated to ensure accurate reports.</p>
            <p>• Track performance by species and revisit low-growth areas.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
