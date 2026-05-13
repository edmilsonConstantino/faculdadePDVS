import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Zap, BadgeAlert, ArrowUpRight, ArrowDownRight, Flame, Wand2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DailySeriesEntry {
  key: string;
  date: string;
  total: number;
}

interface DailyWithSignalsEntry extends DailySeriesEntry {
  cumulative: number;
  ma7: number;
}

interface BestWorst {
  best: DailySeriesEntry | null;
  worst: DailySeriesEntry | null;
}

interface Annotations {
  spike: { from: DailySeriesEntry; to: DailySeriesEntry; delta: number } | null;
  drop: { from: DailySeriesEntry; to: DailySeriesEntry; delta: number } | null;
  streak: number;
  last3TrendPct: number;
  topPayment: string | null;
}

interface Totals {
  revenue: number;
  count: number;
  avg: number;
  items: number;
  prevRevenue: number;
  prevCount: number;
  pct: number;
  salesPct: number;
}

interface DrilledTopProduct {
  productId: string;
  name: string;
  qty: number;
  revenue: number;
}

interface LowStockAlert {
  id: string;
  name: string;
  sku: string;
  stock: string;
  minStock: string;
  unit: string;
}

export interface OverviewTabProps {
  totals: Totals;
  rangeDays: number;
  dailySeries: DailySeriesEntry[];
  dailyWithSignals: DailyWithSignalsEntry[];
  bestWorst: BestWorst;
  annotations: Annotations;
  drilledTopProducts: DrilledTopProduct[];
  drillCategory: string | null;
  lowStockAlerts: LowStockAlert[];
}

export function OverviewTab({
  totals,
  rangeDays,
  dailySeries,
  dailyWithSignals,
  bestWorst,
  annotations,
  drilledTopProducts,
  drillCategory,
  lowStockAlerts,
}: OverviewTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" /> Pro Insights
            </CardTitle>
            <CardDescription>O essencial, com estética limpa e leitura rápida</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="rounded-2xl border border-border bg-muted/15 p-3">
                <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Melhor dia</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{bestWorst.best ? bestWorst.best.date : '—'}</p>
                <p className="mt-1 text-base font-black text-emerald-700 tabular-nums">{bestWorst.best ? formatCurrency(bestWorst.best.total) : '—'}</p>
              </div>
              <div className="rounded-2xl border border-border bg-muted/15 p-3">
                <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Pior dia</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{bestWorst.worst ? bestWorst.worst.date : '—'}</p>
                <p className="mt-1 text-base font-black text-rose-700 tabular-nums">{bestWorst.worst ? formatCurrency(bestWorst.worst.total) : '—'}</p>
              </div>
              <div className="rounded-2xl border border-border bg-muted/15 p-3">
                <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Média (dia)</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{rangeDays} dias</p>
                <p className="mt-1 text-base font-black tabular-nums">{formatCurrency(rangeDays ? totals.revenue / rangeDays : 0)}</p>
              </div>
              <div className="rounded-2xl border border-border bg-muted/15 p-3">
                <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Acumulado</p>
                <p className="mt-1 text-sm font-semibold text-foreground">Período</p>
                <p className="mt-1 text-base font-black text-primary tabular-nums">{formatCurrency(totals.revenue)}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-black">Tendência por dia</p>
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-primary" /> Receita
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-amber-500" /> Média 7d
                  </span>
                </div>
              </div>
              <div className="mb-2 flex flex-wrap gap-2">
                {annotations.spike && (
                  <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/10 px-2 py-1 text-[11px] font-black text-emerald-700">
                    ↑ pico {annotations.spike.to.date} (+{formatCurrency(annotations.spike.delta)})
                  </span>
                )}
                {annotations.drop && (
                  <span className="inline-flex items-center gap-1 rounded-xl bg-rose-500/10 px-2 py-1 text-[11px] font-black text-rose-700">
                    ↓ queda {annotations.drop.to.date} ({formatCurrency(annotations.drop.delta)})
                  </span>
                )}
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-xl px-2 py-1 text-[11px] font-black',
                    annotations.last3TrendPct >= 0 ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive',
                  )}
                >
                  3d {annotations.last3TrendPct >= 0 ? '+' : ''}
                  {annotations.last3TrendPct.toFixed(1)}%
                </span>
              </div>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyWithSignals}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} minTickGap={18} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid hsl(var(--border))' }}
                      formatter={(val: number, name: any) => [formatCurrency(Number(val)), name === 'ma7' ? 'Média móvel (7d)' : 'Receita']}
                    />
                    <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="ma7" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BadgeAlert className="h-5 w-5 text-primary" /> Alertas de estoque
            </CardTitle>
            <CardDescription>Produtos abaixo do mínimo</CardDescription>
          </CardHeader>
          <CardContent>
            {lowStockAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem alertas no momento.</p>
            ) : (
              <div className="space-y-2">
                {lowStockAlerts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.sku}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-black tabular-nums">{parseFloat(p.stock)} {p.unit}</p>
                      <p className="text-xs text-muted-foreground">mín: {parseFloat(p.minStock)} {p.unit}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Evolução (receita diária)</CardTitle>
            <CardDescription>Período: {rangeDays} dias</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailySeries}>
                  <defs>
                    <linearGradient id="mkRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} minTickGap={18} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `MT ${v}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid hsl(var(--border))' }}
                    formatter={(val: number) => formatCurrency(Number(val))}
                  />
                  <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" fill="url(#mkRev)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top produtos (receita)</CardTitle>
            <CardDescription>
              {drillCategory ? `Top 10 em: ${drillCategory}` : 'Top 10 produtos no período'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={drilledTopProducts} layout="vertical" margin={{ left: 8, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} />
                  <YAxis dataKey="name" type="category" width={140} stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid hsl(var(--border))' }}
                    formatter={(val: number) => formatCurrency(Number(val))}
                  />
                  <Bar dataKey="revenue" fill="hsl(32 95% 55%)" radius={[0, 8, 8, 0]} barSize={26} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
