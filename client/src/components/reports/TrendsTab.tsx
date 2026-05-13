import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Area, AreaChart, CartesianGrid, Pie, PieChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

const PAYMENT_COLORS = ['#10b981', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ef4444', '#64748b'];

interface TrendSeriesEntry {
  label: string;
  value: number;
}

interface PaymentBreakdownEntry {
  name: string;
  value: number;
  count: number;
}

export interface TrendsTabProps {
  trendGranularity: 'day' | 'hour';
  setTrendGranularity: (g: 'day' | 'hour') => void;
  trendSeriesDaily: TrendSeriesEntry[];
  trendSeriesHourly: TrendSeriesEntry[];
  paymentBreakdown: PaymentBreakdownEntry[];
}

export function TrendsTab({
  trendGranularity,
  setTrendGranularity,
  trendSeriesDaily,
  trendSeriesHourly,
  paymentBreakdown,
}: TrendsTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Tendência</CardTitle>
                <CardDescription>Por dia (padrão) · mude para hora quando precisar</CardDescription>
              </div>
              <div className="flex w-full gap-1 rounded-2xl bg-muted/60 p-1 sm:w-auto">
                {(['day', 'hour'] as const).map((g) => (
                  <Button
                    key={g}
                    type="button"
                    size="sm"
                    variant={trendGranularity === g ? 'secondary' : 'ghost'}
                    className={cn(
                      'h-9 flex-1 rounded-xl text-xs sm:flex-none',
                      trendGranularity === g
                        ? 'bg-card font-black text-foreground shadow-sm ring-1 ring-primary/20'
                        : 'font-semibold text-muted-foreground hover:text-foreground',
                    )}
                    onClick={() => setTrendGranularity(g)}
                  >
                    {g === 'day' ? 'Dia' : 'Hora'}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendGranularity === 'day' ? trendSeriesDaily : trendSeriesHourly}>
                  <defs>
                    <linearGradient id="mkTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} minTickGap={18} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} />
                  <Tooltip formatter={(val: number) => formatCurrency(Number(val))} />
                  <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#mkTrend)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Métodos de pagamento</CardTitle>
            <CardDescription>Receita por método</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={paymentBreakdown} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                    {paymentBreakdown.map((_, idx) => (
                      <Cell key={idx} fill={PAYMENT_COLORS[idx % PAYMENT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: number) => formatCurrency(Number(val))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 space-y-2">
              {paymentBreakdown.slice(0, 5).map((p, idx) => (
                <div key={p.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: PAYMENT_COLORS[idx % PAYMENT_COLORS.length] }} />
                    <span className="font-semibold">{p.name}</span>
                  </div>
                  <span className="font-black tabular-nums">{formatCurrency(p.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
