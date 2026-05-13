import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface CategoryBreakdownEntry {
  name: string;
  value: number;
}

interface SellerPerformanceEntry {
  id: string;
  name: string;
  total: number;
  count: number;
}

export interface BreakdownTabProps {
  categoryBreakdown: CategoryBreakdownEntry[];
  sellerPerformance: SellerPerformanceEntry[];
  isSeller: boolean;
  setDrillCategory: (cat: string | null) => void;
}

export function BreakdownTab({
  categoryBreakdown,
  sellerPerformance,
  isSeller,
  setDrillCategory,
}: BreakdownTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Vendas por categoria</CardTitle>
            <CardDescription>Distribuição de receita por categoria</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryBreakdown.slice(0, 12)} layout="vertical" margin={{ left: 8, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" width={140} stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(val: number) => formatCurrency(Number(val))} />
                  <Bar
                    dataKey="value"
                    fill="hsl(150 60% 35%)"
                    radius={[0, 8, 8, 0]}
                    barSize={26}
                    onClick={(d: any) => setDrillCategory(d?.name || null)}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Dica: clique numa barra para fazer drilldown dessa categoria.
            </p>
          </CardContent>
        </Card>

        <Card className={cn(isSeller && 'opacity-80')}>
          <CardHeader>
            <CardTitle>Performance por vendedor</CardTitle>
            <CardDescription>{isSeller ? 'Disponível para admin/gestor' : 'Top vendedores no período'}</CardDescription>
          </CardHeader>
          <CardContent>
            {!isSeller ? (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sellerPerformance} layout="vertical" margin={{ left: 8, right: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" width={140} stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(val: number) => formatCurrency(Number(val))} />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} barSize={26} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">
                Sem permissão para ver vendedores.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
