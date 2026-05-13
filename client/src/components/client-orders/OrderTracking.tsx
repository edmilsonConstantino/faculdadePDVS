import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Check, Clock, X, Package, Store, Copy, Share2, Image as ImageIcon } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

export interface OrderData {
  orderCode?: string;
  customerName: string;
  customerPhone: string;
  items: Array<{
    productId: string;
    product?: { name: string };
    quantity: number;
    priceAtSale: number;
  }>;
  total: number;
  status?: 'pending' | 'accepted' | 'ready' | 'completed' | 'cancelled';
  paymentMethod: 'cash' | 'transfer' | 'mpesa' | 'emola' | 'bank';
  paymentProof?: string;
  createdAt?: string;
  acceptedAt?: string;
  readyAt?: string;
  completedAt?: string;
  staffMessage?: string | null;
  staffMessageAt?: string;
}

export interface AuditData {
  order?: { orderCode?: string; status?: string; saleId?: string; last3Phone?: string };
  audit?: {
    order?: Array<{ id: any; createdAt: string; action: string; details?: any }>;
    sale?: Array<{ id: any; createdAt: string; action: string; details?: any }>;
  };
}

export interface OrderTrackingProps {
  order: OrderData;
  auditOpen: boolean;
  auditData: AuditData | null;
  proofOpen: boolean;
  isLoadingAudit: boolean;
  canSeeAudit: boolean;
  onAuditOpenChange: (open: boolean) => void;
  onProofOpenChange: (open: boolean) => void;
  onLoadAudit: () => void;
  onNewOrder: () => void;
}

function getStatusColor(status?: string) {
  switch (status) {
    case 'accepted': return 'bg-primary/15 text-primary';
    case 'ready': return 'bg-accent/15 text-accent';
    case 'completed': return 'bg-green-100 text-green-800';
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getStatusIcon(status?: string) {
  switch (status) {
    case 'accepted': return <Check className="h-4 w-4" />;
    case 'ready': return <Package className="h-4 w-4" />;
    case 'completed': return <Check className="h-4 w-4" />;
    case 'pending': return <Clock className="h-4 w-4" />;
    case 'cancelled': return <X className="h-4 w-4" />;
    default: return null;
  }
}

export function OrderTracking({
  order,
  auditOpen,
  auditData,
  proofOpen,
  isLoadingAudit,
  canSeeAudit,
  onAuditOpenChange,
  onProofOpenChange,
  onLoadAudit,
  onNewOrder,
}: OrderTrackingProps) {
  const timelineSteps = [
    { id: 1, label: 'Recebido' },
    { id: 2, label: 'Aceite' },
    { id: 3, label: 'Pronto' },
    { id: 4, label: 'Entregue' },
  ];

  const currentStep =
    order.status === 'completed' ? 4 :
    order.status === 'ready' ? 3 :
    order.status === 'accepted' ? 2 :
    order.status === 'pending' ? 1 : 0;

  return (
    <>
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="border-gray-200 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <Check className="h-6 w-6 text-green-600" />
              Pedido Confirmado!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Order code */}
            <div className="bg-white p-6 rounded-lg border-2 border-green-300 text-center space-y-2">
              <p className="text-sm text-muted-foreground">Seu código de rastreamento:</p>
              <p className="text-4xl font-bold text-[#B71C1C] tracking-wider font-mono">{order.orderCode}</p>
              <p className="text-xs text-muted-foreground">Guarde este código para acompanhar seu pedido</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(String(order.orderCode || '').trim());
                      toast({ title: 'Copiado', description: 'Código copiado para a área de transferência.' });
                    } catch {
                      toast({ title: 'Falhou', description: 'Não foi possível copiar.', variant: 'destructive' });
                    }
                  }}
                >
                  <Copy className="h-4 w-4" /> Copiar código
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={async () => {
                    const code = String(order.orderCode || '').trim();
                    const text = `Pedido ${code} · Status: ${order.status}`;
                    try {
                      if ((navigator as any).share) {
                        await (navigator as any).share({ title: 'Pedido', text });
                        return;
                      }
                    } catch {
                      // ignore
                    }
                    try {
                      await navigator.clipboard.writeText(text);
                      toast({ title: 'Partilha rápida', description: 'Texto copiado para partilhar.' });
                    } catch {
                      toast({ title: 'Falhou', description: 'Não foi possível partilhar.', variant: 'destructive' });
                    }
                  }}
                >
                  <Share2 className="h-4 w-4" /> Partilhar
                </Button>
              </div>
            </div>

            {/* Customer + total */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-lg border border-gray-100">
                <p className="text-xs text-muted-foreground mb-1">Cliente</p>
                <p className="font-semibold">{order.customerName}</p>
                <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-gray-100">
                <p className="text-xs text-muted-foreground mb-1">Total do Pedido</p>
                <p className="text-2xl font-bold text-[#B71C1C]">{formatCurrency(order.total)}</p>
              </div>
            </div>

            {/* Payment + proof indicator */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-lg border border-gray-100">
                <p className="text-xs text-muted-foreground mb-1">Pagamento</p>
                <p className="font-semibold capitalize">{order.paymentMethod}</p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-gray-100">
                <p className="text-xs text-muted-foreground mb-1">Comprovativo</p>
                <p className="text-sm text-muted-foreground">
                  {order.paymentProof ? 'Anexado' : '—'}
                </p>
              </div>
            </div>

            {/* Proof image thumbnail */}
            {order.paymentProof && (
              <button
                type="button"
                onClick={() => onProofOpenChange(true)}
                className="group overflow-hidden rounded-xl border border-gray-200 bg-white text-left transition hover:shadow-md w-full"
              >
                <div className="flex items-center justify-between gap-2 border-b border-gray-200/60 px-4 py-3">
                  <p className="text-sm font-black text-gray-900 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-[#B71C1C]" /> Comprovativo
                  </p>
                  <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground">Toque para ampliar</span>
                </div>
                <img src={order.paymentProof} alt="" className="h-44 w-full object-cover" />
              </button>
            )}

            {/* Status badge */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="font-semibold text-blue-900 mb-2">Status:</p>
              <Badge className={getStatusColor(order.status)}>
                {getStatusIcon(order.status)}
                <span className="ml-2">
                  {order.status === 'pending' && 'Aguardando Aprovação'}
                  {order.status === 'accepted' && 'Aceite'}
                  {order.status === 'ready' && 'Pronto'}
                  {order.status === 'completed' && 'Entregue'}
                  {order.status === 'cancelled' && 'Cancelado'}
                </span>
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">
                {order.status === 'pending' && 'Seu pedido foi recebido e está aguardando aprovação do lojista.'}
                {order.status === 'accepted' && 'Seu pedido foi aceite e está em preparação.'}
                {order.status === 'ready' && 'Seu pedido está pronto. Pode vir levantar.'}
                {order.status === 'completed' && 'Pedido entregue. Obrigado!'}
              </p>
            </div>

            {/* Store message */}
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="mb-2 flex items-center gap-2 font-semibold text-gray-800">
                <Store className="h-4 w-4 text-[#B71C1C]" />
                Resposta da loja
              </p>
              {order.staffMessage ? (
                <div className="rounded-md border border-gray-100 bg-gray-50/40 p-3">
                  <p className="text-sm font-medium text-gray-900">{order.staffMessage}</p>
                  {order.staffMessageAt && (
                    <p className="mt-1 text-xs text-muted-foreground">Atualizado: {new Date(order.staffMessageAt).toLocaleString()}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Ainda não há mensagem. Assim que a loja responder, aparecerá aqui.</p>
              )}
            </div>

            {/* Timeline */}
            <div className="rounded-lg border border-border bg-white p-4">
              <p className="mb-3 font-semibold text-gray-900">Linha do tempo</p>
              <div className="grid grid-cols-4 gap-2">
                {timelineSteps.map((s) => {
                  const done = currentStep >= s.id;
                  return (
                    <div key={s.id} className="text-center">
                      <div className={`mx-auto mb-2 h-2.5 w-2.5 rounded-full ${done ? 'bg-gray-500' : 'bg-gray-300'}`} />
                      <p className={`text-xs font-semibold ${done ? 'text-gray-900' : 'text-muted-foreground'}`}>{s.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <Button
              onClick={onNewOrder}
              className="w-full bg-[#B71C1C] hover:bg-[#9b1414]"
            >
              Fazer Novo Pedido
            </Button>

            {canSeeAudit && order.orderCode && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={onLoadAudit}
                disabled={isLoadingAudit}
              >
                {isLoadingAudit ? 'Carregando auditoria…' : 'Auditoria profunda (admin/gestor)'}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Audit dialog */}
      <Dialog open={auditOpen} onOpenChange={onAuditOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Auditoria profunda do pedido</DialogTitle>
          </DialogHeader>
          {!auditData ? (
            <div className="py-6 text-sm text-muted-foreground">Sem dados.</div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-muted/20 p-4">
                <p className="text-sm font-black">
                  Pedido <span className="font-mono">#{auditData.order?.orderCode}</span> · {auditData.order?.status}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  SaleId: {auditData.order?.saleId || '—'} · Last3: {auditData.order?.last3Phone || '—'}
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-border bg-white p-4">
                  <p className="text-sm font-black mb-2">Eventos (Order)</p>
                  <div className="space-y-2">
                    {(auditData.audit?.order || []).slice(0, 60).map((l) => (
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
                    {(auditData.audit?.sale || []).slice(0, 60).map((l) => (
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

      {/* Proof image dialog */}
      <Dialog open={proofOpen} onOpenChange={onProofOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" /> Comprovativo
            </DialogTitle>
          </DialogHeader>
          {order?.paymentProof ? (
            <div className="overflow-hidden rounded-2xl border border-border bg-black">
              <img src={order.paymentProof} alt="" className="max-h-[70vh] w-full object-contain" />
            </div>
          ) : (
            <div className="py-6 text-sm text-muted-foreground">Sem comprovativo.</div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
