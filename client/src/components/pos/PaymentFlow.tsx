import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  ShoppingBag,
  Trash2,
  Scale,
  CreditCard,
  Banknote,
  QrCode,
  Check,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { type Product } from '@/lib/api';
import type { CartItem } from '@/lib/cart';

export type PaymentMethod = 'cash' | 'card' | 'pix' | 'mpesa' | 'emola' | 'pos' | 'bank';

export interface PaymentFlowProps {
  /* Weight dialog */
  weightOpen: boolean;
  selectedWeightProduct: Product | null;
  weightInGrams: number;
  onWeightOpenChange: (open: boolean) => void;
  onWeightInGramsChange: (g: number) => void;
  onConfirmWeightAdd: () => void;

  /* Preview confirm dialog */
  showPreviewConfirm: boolean;
  selectedPaymentMethod: PaymentMethod | null;
  cart: CartItem[];
  products: Product[];
  subtotal: number;
  discountAmount: number;
  cartTotal: number;
  activeDiscount: { type: string; value: number };
  amountReceived: number;
  change: number;
  onShowPreviewConfirmChange: (open: boolean) => void;
  onConfirmPreview: () => void;

  /* Payment dialog */
  paymentOpen: boolean;
  onPaymentOpenChange: (open: boolean) => void;
  onAmountReceivedChange: (v: number) => void;
  onRemoveFromCart: (productId: string) => void;
  onCheckout: (method: PaymentMethod) => void;
}

export function PaymentFlow({
  weightOpen,
  selectedWeightProduct,
  weightInGrams,
  onWeightOpenChange,
  onWeightInGramsChange,
  onConfirmWeightAdd,

  showPreviewConfirm,
  selectedPaymentMethod,
  cart,
  products,
  subtotal,
  discountAmount,
  cartTotal,
  activeDiscount,
  amountReceived,
  change,
  onShowPreviewConfirmChange,
  onConfirmPreview,

  paymentOpen,
  onPaymentOpenChange,
  onAmountReceivedChange,
  onRemoveFromCart,
  onCheckout,
}: PaymentFlowProps) {
  return (
    <>
      {/* Weight dialog */}
      <Dialog open={weightOpen} onOpenChange={onWeightOpenChange}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-sm overflow-hidden rounded-[2rem] border-none p-0 shadow-2xl">
          {/* Banner */}
          <div className="relative overflow-hidden bg-[#B71C1C] px-5 py-4">
            <div className="banner-texture" />
            <div className="relative flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
                <Scale className="h-4 w-4 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <DialogTitle className="text-sm font-extrabold text-white">Informar Peso</DialogTitle>
                <DialogDescription className="text-[11px] text-white/60">
                  {selectedWeightProduct?.name} · {formatCurrency(parseFloat(selectedWeightProduct?.price || '0'))}/kg
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="space-y-4 px-5 py-4">
            {/* Atalhos de peso */}
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">Quantidade rápida</p>
              <div className="grid grid-cols-4 gap-2">
                {([100, 250, 500, 1000] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => onWeightInGramsChange(g)}
                    data-testid={`button-weight-${g}`}
                    className={`rounded-xl border py-2 text-sm font-bold transition-all active:scale-95 ${
                      weightInGrams === g
                        ? 'border-[#B71C1C] bg-[#B71C1C] text-white shadow-sm'
                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-[#B71C1C]/40 hover:bg-[#B71C1C]/5 hover:text-[#B71C1C]'
                    }`}
                  >
                    {g < 1000 ? `${g}g` : '1kg'}
                  </button>
                ))}
              </div>
            </div>

            {/* Input manual */}
            <div>
              <Label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-400">Peso manual (g)</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={weightInGrams}
                  onChange={(e) => onWeightInGramsChange(Number(e.target.value))}
                  className="h-11 rounded-xl border-gray-200 bg-gray-50 pr-10 text-base font-bold focus-visible:border-[#B71C1C]/40 focus-visible:ring-[#B71C1C]/15"
                  data-testid="input-weight-grams"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">g</span>
              </div>
            </div>

            {/* Preço calculado */}
            <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
              <p className="text-xs font-semibold text-gray-500">Preço calculado</p>
              <p className="text-lg font-black tabular-nums text-[#B71C1C]">
                {formatCurrency(((parseFloat(selectedWeightProduct?.price || '0')) * weightInGrams) / 1000)}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-2 border-t border-gray-100 px-5 py-3">
            <button
              type="button"
              onClick={() => onWeightOpenChange(false)}
              data-testid="button-cancel-weight"
              className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirmWeightAdd}
              disabled={weightInGrams <= 0}
              data-testid="button-confirm-weight"
              className="flex-1 rounded-xl bg-gradient-to-r from-[#B71C1C] to-[#7f1d1d] py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-40"
            >
              Confirmar
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmação final — recibo mental */}
      <Dialog open={showPreviewConfirm} onOpenChange={onShowPreviewConfirmChange}>
        <DialogContent className="max-h-[min(90dvh,640px)] overflow-y-auto rounded-2xl border-0 p-0 sm:max-w-lg">
          <div className="bg-gradient-to-br from-[#B71C1C] to-[#7F1D1D] px-6 pb-6 pt-6 text-primary-foreground">
            <DialogHeader className="space-y-1 text-left">
              <DialogTitle className="font-heading text-xl font-bold text-white">Confirmar venda</DialogTitle>
              <DialogDescription className="text-sm text-white/85">
                Última verificação antes de registar no sistema
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md">
              <p className="text-[0.65rem] font-bold uppercase tracking-wider text-white/75">Total</p>
              <p className="font-heading text-3xl font-bold tabular-nums">{formatCurrency(cartTotal)}</p>
            </div>
          </div>
          <div className="space-y-4 px-6 py-5">
            <div className="rounded-2xl border border-border bg-muted/20 p-4">
              <h4 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                <ShoppingBag className="h-4 w-4 text-primary" />
                Itens ({cart.length})
              </h4>
              <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
                {cart.map((item, idx) => {
                  const product = products.find((p) => p.id === item.productId);
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-card px-3 py-2 text-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{product?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity.toFixed(product?.unit === 'kg' ? 3 : 0)} {product?.unit} × {formatCurrency(item.priceAtSale)}
                        </p>
                      </div>
                      <span className="shrink-0 font-bold text-primary">{formatCurrency(item.quantity * item.priceAtSale)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2 rounded-2xl border border-border bg-card p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              {activeDiscount.type !== 'none' && (
                <div className="flex justify-between font-medium text-primary">
                  <span>Desconto</span>
                  <span>−{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                <span>A pagar</span>
                <span className="text-primary">{formatCurrency(cartTotal)}</span>
              </div>
            </div>
            <div className="rounded-2xl border border-dashed border-primary/25 bg-primary/5 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-primary">Pagamento</p>
              <p className="mt-1 text-lg font-bold capitalize text-foreground">{selectedPaymentMethod?.replace('-', ' ')}</p>
              {selectedPaymentMethod === 'cash' && (
                <div className="mt-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Recebido</span>
                    <span className="font-semibold">{formatCurrency(amountReceived)}</span>
                  </div>
                  <div className={`flex justify-between font-bold ${change >= 0 ? 'text-primary' : 'text-destructive'}`}>
                    <span>Troco</span>
                    <span>{formatCurrency(change)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 border-t border-border bg-muted/10 px-6 py-4 sm:flex-row">
            <Button variant="outline" className="h-12 w-full rounded-xl font-semibold" onClick={() => onShowPreviewConfirmChange(false)}>
              Ajustar
            </Button>
            <Button
              onClick={onConfirmPreview}
              className="h-12 w-full rounded-xl border-0 bg-gradient-to-r from-[#B71C1C] to-[#1B3A5C] font-bold text-primary-foreground shadow-lg"
            >
              <Check className="mr-2 h-4 w-4" />
              Confirmar e registar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment method dialog */}
      <Dialog open={paymentOpen} onOpenChange={onPaymentOpenChange}>
        <DialogContent className="max-h-[min(94dvh,780px)] overflow-y-auto rounded-2xl border-0 p-0 sm:max-w-2xl">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#B71C1C] to-[#7F1D1D] px-6 pb-8 pt-6 text-primary-foreground">
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
            <DialogHeader className="relative space-y-1 text-left">
              <DialogTitle className="font-heading text-2xl font-bold tracking-tight text-white">Finalizar venda</DialogTitle>
              <DialogDescription className="text-sm font-medium text-white/85">
                Revise linhas, valor recebido e escolha como pagou
              </DialogDescription>
            </DialogHeader>
            <div className="relative mt-5 grid grid-cols-2 gap-3 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md">
              <div>
                <p className="text-[0.65rem] font-bold uppercase tracking-wider text-white/75">Linhas</p>
                <p className="text-2xl font-bold">{cart.length}</p>
              </div>
              <div className="text-right">
                <p className="text-[0.65rem] font-bold uppercase tracking-wider text-white/75">Total</p>
                <p className="font-heading text-2xl font-bold tabular-nums">{formatCurrency(cartTotal)}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 px-6 py-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-3">
                  <ShoppingBag className="h-4 w-4 text-primary" />
                  <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Artigos</h4>
                </div>
                <div className="max-h-[200px] divide-y divide-border overflow-y-auto md:max-h-[260px]">
                  {cart.map((item, idx) => {
                    const product = products.find((p) => p.id === item.productId);
                    return (
                      <div key={idx} className="flex items-center gap-3 px-3 py-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-xs font-bold text-primary">
                          {product?.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-foreground">{product?.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {item.quantity.toFixed(product?.unit === 'kg' ? 1 : 0)}
                            {product?.unit} × {formatCurrency(item.priceAtSale)}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-bold text-primary">
                          {formatCurrency(item.quantity * item.priceAtSale)}
                        </span>
                        <button
                          type="button"
                          className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => onRemoveFromCart(item.productId)}
                          data-testid={`button-remove-checkout-${item.productId}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border-2 border-primary/15 bg-gradient-to-br from-primary/5 to-accent/5 p-4">
                <Label className="text-sm font-bold text-foreground">Valor recebido (dinheiro)</Label>
                <div className="relative mt-2">
                  <Input
                    type="number"
                    className="h-12 rounded-xl border-border pr-12 text-right text-lg font-bold tabular-nums"
                    value={amountReceived === 0 ? '' : amountReceived}
                    onChange={(e) => onAmountReceivedChange(Number(e.target.value))}
                    placeholder="0"
                    data-testid="input-amount-received"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                    MT
                  </span>
                </div>
                {amountReceived > 0 && (
                  <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
                    <span className="text-sm font-bold text-muted-foreground">Troco</span>
                    <span
                      className={`text-xl font-bold tabular-nums ${change < 0 ? 'text-destructive' : 'text-primary'}`}
                      data-testid="text-change"
                    >
                      {formatCurrency(change)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-center text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">Método de pagamento</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-2">
                <Button
                  variant="outline"
                  className="flex flex-col h-16 md:h-20 gap-1 text-xs md:text-sm hover:border-primary hover:bg-primary/5 hover:text-primary transition-all"
                  onClick={() => onCheckout('cash')}
                  disabled={amountReceived < cartTotal && amountReceived > 0}
                  data-testid="button-payment-cash"
                >
                  <Banknote className="h-4 w-4 md:h-5 md:w-5" />
                  Dinheiro
                </Button>
                <Button
                  variant="outline"
                  className="flex flex-col h-16 md:h-20 gap-1 text-xs md:text-sm hover:border-primary hover:bg-primary/5 hover:text-primary transition-all"
                  onClick={() => onCheckout('card')}
                  data-testid="button-payment-card"
                >
                  <CreditCard className="h-4 w-4 md:h-5 md:w-5" />
                  Cartão (POS)
                </Button>
                <Button
                  variant="outline"
                  className="flex flex-col h-16 md:h-20 gap-1 text-xs md:text-sm hover:border-primary hover:bg-primary/5 hover:text-primary transition-all"
                  onClick={() => onCheckout('pix')}
                  data-testid="button-payment-pix"
                >
                  <QrCode className="h-4 w-4 md:h-5 md:w-5" />
                  M-Pesa
                </Button>
                <Button
                  variant="outline"
                  className="flex flex-col h-16 md:h-20 gap-1 text-xs md:text-sm hover:border-primary hover:bg-primary/5 hover:text-primary transition-all"
                  onClick={() => onCheckout('emola')}
                  data-testid="button-payment-emola"
                >
                  <CreditCard className="h-4 w-4 md:h-5 md:w-5" />
                  e-Mola
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
