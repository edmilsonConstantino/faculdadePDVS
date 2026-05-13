import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Activity,
  AlertCircle,
  CalendarIcon,
  DollarSign,
  Edit,
  History,
  Package,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  Users,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { UseMutationResult } from '@tanstack/react-query';

interface AuditStats {
  total: number;
  today: number;
  creates: number;
  sales: number;
}

interface AuditTabProps {
  users: any[];
  auditLogs: any[];
  filteredAuditLogs: any[];
  auditStats: AuditStats;
  searchHistory: string;
  setSearchHistory: (v: string) => void;
  actionFilter: string;
  setActionFilter: (v: string) => void;
  userFilter: string;
  setUserFilter: (v: string) => void;
  orderAuditCode: string;
  setOrderAuditCode: (v: string) => void;
  orderAuditMutation: UseMutationResult<any, Error, string, unknown>;
  orderAuditData: any;
  orderAuditOpen: boolean;
  setOrderAuditOpen: (open: boolean) => void;
  getActionIcon: (action: string) => React.ReactNode;
  getActionColor: (action: string) => string;
}

export function AuditTab({
  users,
  filteredAuditLogs,
  auditStats,
  searchHistory,
  setSearchHistory,
  actionFilter,
  setActionFilter,
  userFilter,
  setUserFilter,
  orderAuditCode,
  setOrderAuditCode,
  orderAuditMutation,
  orderAuditData,
  orderAuditOpen,
  setOrderAuditOpen,
  getActionIcon,
  getActionColor,
}: AuditTabProps) {
  return (
    <TabsContent value="audit" className="space-y-4">
      <Card className="border border-border/70">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Rastrear Pedido (Por Código)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium">Código do pedido</Label>
            <div className="flex items-center gap-2">
              <Input
                value={orderAuditCode}
                onChange={(e) => setOrderAuditCode(e.target.value)}
                placeholder="Ex: ABC12345"
                className="font-mono"
              />
              <Button
                type="button"
                className="shrink-0"
                onClick={() => orderAuditMutation.mutate(orderAuditCode)}
                disabled={orderAuditMutation.isPending}
              >
                {orderAuditMutation.isPending ? 'Consultando…' : 'Consultar auditoria'}
              </Button>
            </div>
          </div>

          <Dialog open={orderAuditOpen} onOpenChange={setOrderAuditOpen}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Auditoria profunda do pedido</DialogTitle>
                <DialogDescription>
                  Eventos do pedido e da venda associada (se existir).
                </DialogDescription>
              </DialogHeader>
              {!orderAuditData ? (
                <div className="py-6 text-sm text-muted-foreground">Sem dados.</div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-border bg-muted/20 p-4">
                    <p className="text-sm font-black">
                      Pedido <span className="font-mono">#{orderAuditData.order?.orderCode}</span> · {orderAuditData.order?.status}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      SaleId: {orderAuditData.order?.saleId || '—'} · Last3: {orderAuditData.order?.last3Phone || '—'} · Pagamento: {orderAuditData.order?.paymentMethod || '—'}
                    </p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-border bg-white p-4">
                      <p className="text-sm font-black mb-2">Eventos (Order)</p>
                      <div className="space-y-2">
                        {(orderAuditData.audit?.order || []).slice(0, 80).map((l: any) => (
                          <div key={String(l.id) + String(l.createdAt)} className="rounded-xl border border-border/70 bg-muted/10 px-3 py-2">
                            <p className="text-sm font-semibold">{l.action}</p>
                            <p className="text-xs text-muted-foreground">{new Date(l.createdAt).toLocaleString()}</p>
                            {l.details && (
                              <pre className="mt-2 max-h-28 overflow-auto rounded-lg bg-black/90 p-2 text-[11px] text-white">
                                {JSON.stringify(l.details, null, 2)}
                              </pre>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-white p-4">
                      <p className="text-sm font-black mb-2">Eventos (Sale)</p>
                      <div className="space-y-2">
                        {(orderAuditData.audit?.sale || []).slice(0, 80).map((l: any) => (
                          <div key={String(l.id) + String(l.createdAt)} className="rounded-xl border border-border/70 bg-muted/10 px-3 py-2">
                            <p className="text-sm font-semibold">{l.action}</p>
                            <p className="text-xs text-muted-foreground">{new Date(l.createdAt).toLocaleString()}</p>
                            {l.details && (
                              <pre className="mt-2 max-h-28 overflow-auto rounded-lg bg-black/90 p-2 text-[11px] text-white">
                                {JSON.stringify(l.details, null, 2)}
                              </pre>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: 'Total de ações', value: auditStats.total, Icon: Activity, color: 'text-primary bg-primary/10' },
          { label: 'Hoje', value: auditStats.today, Icon: CalendarIcon, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Criações', value: auditStats.creates, Icon: Plus, color: 'text-blue-600 bg-blue-50' },
          { label: 'Vendas', value: auditStats.sales, Icon: DollarSign, color: 'text-orange-600 bg-orange-50' },
        ].map(({ label, value, Icon, color }) => (
          <Card key={label} className="border border-border/60 shadow-sm">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
              </div>
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar ação, usuário ou entidade..."
            className="h-9 pl-9 text-sm"
            value={searchHistory}
            onChange={(e) => setSearchHistory(e.target.value)}
            data-testid="input-search-audit"
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="h-9 w-full text-sm md:w-[160px]">
            <SelectValue placeholder="Serviço" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Serviços</SelectItem>
            <SelectItem value="product">Produtos</SelectItem>
            <SelectItem value="user">Usuários</SelectItem>
            <SelectItem value="sale">Vendas</SelectItem>
            <SelectItem value="stock">Estoque</SelectItem>
          </SelectContent>
        </Select>
        <Select value={userFilter} onValueChange={setUserFilter}>
          <SelectTrigger className="h-9 w-full text-sm md:w-[180px]">
            <SelectValue placeholder="Utilizador" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Todos Usuários</SelectItem>
            {users.map(u => (
              <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Timeline de Auditoria */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Linha do Tempo de Atividades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredAuditLogs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma atividade encontrada</p>
              </div>
            ) : (
              filteredAuditLogs.map((log) => {
                const logUser = users.find(u => u.id === log.userId);
                return (
                  <div
                    key={log.id}
                    data-testid={`row-audit-${log.id}`}
                    className="relative pl-8 pb-8 border-l-2 border-border last:border-0 last:pb-0"
                  >
                    {/* Timeline dot */}
                    <div className={`absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 border-background ${getActionColor(log.action).replace('text-', 'bg-').split(' ')[0]}`} />

                    <div className="bg-muted/30 rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className={`${getActionColor(log.action)} border font-medium flex items-center gap-1`}>
                            {getActionIcon(log.action)}
                            {log.action}
                          </Badge>
                          <span className="text-sm font-mono text-muted-foreground">
                            {log.entityType}
                            {log.entityId && <span className="ml-1">#{log.entityId.slice(-6)}</span>}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(log.createdAt), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                          {logUser?.name?.charAt(0)?.toUpperCase() ?? 'S'}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{logUser?.name || 'Sistema'}</p>
                          <p className="text-xs text-muted-foreground">@{logUser?.username || 'sistema'}</p>
                        </div>
                      </div>

                      {log.details && (
                        <div className="mt-3 p-3 bg-background/50 rounded border border-border">
                          <p className="text-xs font-semibold text-muted-foreground mb-2">Detalhes da Ação:</p>
                          <pre className="text-xs overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
