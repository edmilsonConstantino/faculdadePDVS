import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { FileDown } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface DetailedRow {
  id: string | number;
  shortId: string;
  createdAt: Date;
  seller: string;
  paymentMethod: string;
  items: number;
  total: number;
}

export interface DetailedLedgerProps {
  detailedRows: DetailedRow[];
  onExportCsv: () => void;
}

export function DetailedLedger({ detailedRows, onExportCsv }: DetailedLedgerProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-lg font-black">Relatório detalhado</p>
          <p className="text-sm text-muted-foreground">Lista de vendas do período com export CSV.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="gap-2 rounded-xl"
            onClick={onExportCsv}
          >
            <FileDown className="h-4 w-4" /> CSV (Detalhado)
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vendas</CardTitle>
          <CardDescription>{detailedRows.length} registros</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-6 px-6">
            <div className="min-w-[860px]">
              <div className="grid grid-cols-[120px_180px_1fr_140px_100px_140px] gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2 text-xs font-bold text-muted-foreground">
                <div>ID</div>
                <div>Data</div>
                <div>Vendedor</div>
                <div>Pagamento</div>
                <div>Itens</div>
                <div className="text-right">Total</div>
              </div>
              <div className="mt-2 divide-y rounded-xl border border-border bg-card">
                {detailedRows.length === 0 ? (
                  <div className="p-6 text-sm text-muted-foreground">Sem dados no período.</div>
                ) : (
                  detailedRows.slice(0, 200).map((r) => (
                    <div key={r.id} className="grid grid-cols-[120px_180px_1fr_140px_100px_140px] gap-2 px-3 py-2 text-sm">
                      <div className="font-mono font-bold">#{r.shortId}</div>
                      <div className="text-muted-foreground">{format(r.createdAt, 'dd/MM HH:mm', { locale: ptBR })}</div>
                      <div className="font-semibold truncate">{r.seller}</div>
                      <div className="text-muted-foreground">{r.paymentMethod}</div>
                      <div className="text-muted-foreground tabular-nums">{r.items}</div>
                      <div className="text-right font-black tabular-nums">{formatCurrency(r.total)}</div>
                    </div>
                  ))
                )}
              </div>
              {detailedRows.length > 200 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Mostrando 200 de {detailedRows.length}. Use o CSV para export completo.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
