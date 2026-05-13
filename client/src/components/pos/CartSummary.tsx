import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import {
  ShoppingCart,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Percent,
  Banknote,
  GripHorizontal,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { type Product } from '@/lib/api';
import type { CartItem } from '@/lib/cart';

export interface CartSummaryProps {
  cart: CartItem[];
  products: Product[];
  subtotal: number;
  discountAmount: number;
  cartTotal: number;
  activeDiscount: { type: string; value: number };
  discountOpen: boolean;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  canApplyDiscount: boolean;
  cartSheetOpen: boolean;
  isMobileViewport: boolean;
  onCartSheetOpenChange: (open: boolean) => void;
  onQuantityChange: (productId: string, delta: number) => void;
  onRemoveFromCart: (productId: string) => void;
  onUpdateCartQuantity: (productId: string, qty: number, stock: number) => void;
  onFlashStockPreview: (product: Product, qty: number) => void;
  onClearCart: () => void;
  onOpenCheckout: () => void;
  onDiscountOpenChange: (open: boolean) => void;
  onDiscountTypeChange: (type: 'percentage' | 'fixed') => void;
  onDiscountValueChange: (value: number) => void;
  onApplyDiscount: () => void;
}

export function CartSummary({
  cart,
  products,
  subtotal,
  discountAmount,
  cartTotal,
  activeDiscount,
  discountOpen,
  discountType,
  discountValue,
  canApplyDiscount,
  cartSheetOpen,
  isMobileViewport,
  onCartSheetOpenChange,
  onQuantityChange,
  onRemoveFromCart,
  onUpdateCartQuantity,
  onFlashStockPreview,
  onClearCart,
  onOpenCheckout,
  onDiscountOpenChange,
  onDiscountTypeChange,
  onDiscountValueChange,
  onApplyDiscount,
}: CartSummaryProps) {
  return (
    <>
      {/* Barra flutuante arrastável — acima do dock (z acima do conteúdo, abaixo do sheet) */}
      <AnimatePresence>
        {cart.length > 0 && !cartSheetOpen && (
          <div
            className="pointer-events-none fixed inset-x-0 z-[42] flex justify-center px-3 lg:hidden"
            style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))' }}
          >
            <motion.div
              initial={{ opacity: 0, y: 28, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              drag
              dragMomentum={false}
              dragElastic={0.12}
              dragConstraints={{ left: -120, right: 120, top: -100, bottom: 80 }}
              className="pointer-events-auto w-full max-w-md cursor-grab active:cursor-grabbing"
              data-testid="wrapper-floating-cart"
            >
              <div className="flex flex-col gap-0.5 rounded-[1.2rem] border border-white/25 bg-gradient-to-r from-[#B71C1C] to-[#7F1D1D] p-1 text-primary-foreground shadow-[0_16px_40px_-12px_rgba(183,28,28,0.4)] ring-2 ring-white/20">
                <div
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-white/10 py-1"
                  title="Arraste para o lado se estiver a tapar um produto"
                >
                  <GripHorizontal className="h-3.5 w-3.5 opacity-80" strokeWidth={2.5} />
                  <span className="text-[0.55rem] font-bold uppercase tracking-widest text-white/80">Arrastar</span>
                </div>
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => onCartSheetOpenChange(true)}
                  className="flex w-full items-center gap-2.5 rounded-xl bg-black/10 px-2.5 py-2 text-left transition active:scale-[0.99]"
                  data-testid="button-floating-cart"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20 text-sm font-black ring-2 ring-white/35">
                    {cart.length}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-white/80">Carrinho</p>
                    <p className="text-base font-black tabular-nums leading-tight">{formatCurrency(cartTotal)}</p>
                    <p className="truncate text-[10px] font-medium text-white/70">Toque para abrir · arraste a zona acima</p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 rounded-lg bg-white/15 px-2 py-1.5 text-xs font-bold ring-1 ring-white/25">
                    Abrir
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MOBILE: carrinho em sheet (bottom) */}
      <Sheet open={cartSheetOpen} onOpenChange={onCartSheetOpenChange}>
        <SheetContent
          side="bottom"
          className="flex h-[min(88dvh,660px)] flex-col gap-0 overflow-hidden rounded-t-[1.75rem] border-0 bg-white p-0 shadow-[0_-16px_48px_-12px_rgba(15,23,42,0.18)] lg:hidden"
        >
          {/* drag handle */}
          <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-gray-200" aria-hidden />

          {/* Banner compacto */}
          <div className="relative shrink-0 overflow-hidden bg-[#B71C1C] px-4 pb-4 pt-3">
            <div className="banner-texture" />
            <div className="relative flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
                  <ShoppingCart className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
                </div>
                <div className="min-w-0">
                  <SheetTitle className="text-sm font-extrabold leading-tight text-white">
                    Carrinho
                  </SheetTitle>
                  <SheetDescription className="text-[11px] font-medium text-white/60">
                    {cart.length} {cart.length === 1 ? 'item' : 'itens'} · deslize para rever
                  </SheetDescription>
                </div>
              </div>
              {/* Total pill */}
              <div className="shrink-0 rounded-xl border border-white/25 bg-white/15 px-3 py-1.5 backdrop-blur-sm">
                <p className="text-[9px] font-bold uppercase tracking-widest text-white/60">Total</p>
                <p className="text-base font-black tabular-nums text-white leading-tight">{formatCurrency(cartTotal)}</p>
                {activeDiscount.type !== 'none' && (
                  <p className="text-[10px] font-semibold text-white/70">−{formatCurrency(discountAmount)}</p>
                )}
              </div>
            </div>
          </div>

          {/* Lista */}
          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
                  <ShoppingBag className="h-6 w-6 text-gray-300" />
                </div>
                <p className="text-sm font-semibold text-gray-700">Ainda sem itens</p>
                <p className="mt-0.5 text-xs text-gray-400">Toque em + nos produtos para adicionar.</p>
                <Button
                  className="mt-4 h-9 rounded-xl bg-gradient-to-r from-[#B71C1C] to-[#7f1d1d] px-4 text-sm font-bold text-white shadow-sm"
                  onClick={() => onCartSheetOpenChange(false)}
                >
                  Adicionar produtos
                </Button>
              </div>
            ) : (
              <ul className="space-y-2">
                <AnimatePresence initial={false} mode="popLayout">
                  {cart.map((item, idx) => {
                    const product = products.find((p) => p.id === item.productId);
                    if (!product) return null;
                    return (
                      <motion.li
                        key={item.productId}
                        layout
                        initial={{ opacity: 0, y: 12, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -20, transition: { duration: 0.18 } }}
                        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                        className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
                      >
                        <div className="flex gap-2.5 px-3 py-2.5">
                          <div className="relative shrink-0">
                            <span className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#B71C1C] text-[10px] font-black text-white shadow">
                              {idx + 1}
                            </span>
                            <div className="h-14 w-14 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                              {product.image ? (
                                <img src={product.image} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-[#B71C1C]/8 text-base font-black text-[#B71C1C]">
                                  {product.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="line-clamp-1 text-[13px] font-bold leading-tight text-gray-800">{product.name}</h4>
                            <p className="mt-0.5 text-[11px] text-gray-400">{formatCurrency(item.priceAtSale)} / {product.unit}</p>
                            <p className="mt-0.5 text-sm font-black text-[#B71C1C] tabular-nums">{formatCurrency(item.priceAtSale * item.quantity)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 border-t border-gray-50 bg-gray-50/60 px-3 py-2">
                          <button
                            type="button"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[#B71C1C] transition active:scale-95"
                            onClick={(e) => { e.stopPropagation(); onQuantityChange(item.productId, -1); }}
                            data-testid={`button-decrease-mobile-${item.productId}`}
                          >
                            <Minus className="h-4 w-4" strokeWidth={2.5} />
                          </button>
                          <Input
                            type="number"
                            step={product.unit === 'kg' ? '0.1' : '1'}
                            value={item.quantity.toFixed(product.unit === 'kg' ? 1 : 0)}
                            onChange={(e) => {
                              const newQty = parseFloat(e.target.value) || 0;
                              if (newQty > 0) {
                                onUpdateCartQuantity(item.productId, newQty, parseFloat(product.stock));
                                if (newQty <= parseFloat(product.stock)) {
                                  onFlashStockPreview(product, newQty);
                                }
                              }
                            }}
                            className="h-9 flex-1 rounded-lg border-gray-200 bg-white text-center text-sm font-black tabular-nums"
                            data-testid={`input-quantity-${item.productId}`}
                          />
                          <button
                            type="button"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#B71C1C] text-white shadow-sm transition active:scale-95"
                            onClick={(e) => { e.stopPropagation(); onQuantityChange(item.productId, 1); }}
                            data-testid={`button-increase-mobile-${item.productId}`}
                          >
                            <Plus className="h-4 w-4" strokeWidth={2.5} />
                          </button>
                          <button
                            type="button"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition hover:border-red-200 hover:text-red-500 active:scale-95"
                            onClick={(e) => { e.stopPropagation(); onRemoveFromCart(item.productId); }}
                            data-testid={`button-remove-mobile-${item.productId}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t border-gray-100 bg-white px-3 py-3">
            {cart.length > 0 && (
              <div className="mb-2.5 flex items-center justify-between text-xs">
                <span className="text-gray-400">Subtotal</span>
                <span className="font-semibold text-gray-700">{formatCurrency(subtotal)}</span>
              </div>
            )}
            {activeDiscount.type !== 'none' && (
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="text-gray-400">Desconto</span>
                <span className="font-semibold text-[#B71C1C]">−{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="h-10 rounded-xl border-gray-200 text-sm font-semibold text-gray-600"
                onClick={() => onClearCart()}
                data-testid="button-clear-mobile"
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Limpar
              </Button>
              <Button
                className="h-10 rounded-xl border-0 bg-gradient-to-r from-[#B71C1C] to-[#7f1d1d] text-sm font-bold text-white shadow-md shadow-[#B71C1C]/25 disabled:opacity-50"
                disabled={cart.length === 0}
                onClick={() => onOpenCheckout()}
                data-testid="button-checkout-mobile"
              >
                Finalizar <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop cart panel */}
      <div className="hidden h-full w-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-[0_24px_60px_-40px_hsl(172_50%_30%/0.2)] lg:flex lg:w-[400px] xl:w-[420px]">
        <div className="relative shrink-0 overflow-hidden border-b border-white/10 bg-gradient-to-br from-[#B71C1C] to-[#7F1D1D] px-4 py-4 text-primary-foreground">
          <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
          <h2 className="font-heading flex items-center gap-2 text-lg font-bold tracking-tight">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
              <ShoppingCart className="h-5 w-5" />
            </span>
            Carrinho
          </h2>
          <p className="mt-1 text-sm font-medium text-white/85" data-testid="text-cart-count">
            {cart.length} {cart.length === 1 ? 'linha' : 'linhas'} · {formatCurrency(cartTotal)}
          </p>
        </div>

        <ScrollArea className="min-h-0 flex-1 p-3">
          {cart.length === 0 ? (
            <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-3 px-4 py-12 text-center text-muted-foreground">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <ShoppingBag className="h-8 w-8 opacity-40" />
              </div>
              <p className="font-semibold text-foreground">Pronto para vender</p>
              <p className="text-xs leading-relaxed">Clique nos produtos à esquerda ou use o scanner.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {cart.map((item) => {
                const product = products.find((p) => p.id === item.productId);
                if (!product) return null;
                return (
                  <div
                    key={item.productId}
                    className="flex gap-3 rounded-2xl border border-border/90 bg-gradient-to-br from-card to-muted/20 p-3 shadow-sm transition hover:border-primary/25 hover:shadow-md"
                    data-testid={`cart-item-${item.productId}`}
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
                      {product.image ? (
                        <img src={product.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-lg font-bold text-primary">{product.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-bold text-foreground">{product.name}</h4>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        <span className="font-semibold text-primary">{formatCurrency(item.priceAtSale)}</span> ×{' '}
                        {item.quantity.toFixed(product.unit === 'kg' ? 3 : 0)}
                        {product.unit}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <button
                          type="button"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background hover:bg-muted"
                          onClick={() => onQuantityChange(item.productId, -1)}
                          data-testid={`button-decrease-${item.productId}`}
                        >
                          <Minus className="h-3.5 w-3.5 text-destructive" />
                        </button>
                        <span className="flex h-8 min-w-8 items-center justify-center rounded-lg border border-border bg-muted/50 px-2 text-xs font-bold tabular-nums">
                          {item.quantity.toFixed(product.unit === 'kg' ? 3 : 0)}
                        </span>
                        <button
                          type="button"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background hover:bg-muted"
                          onClick={() => onQuantityChange(item.productId, 1)}
                          data-testid={`button-increase-${item.productId}`}
                        >
                          <Plus className="h-3.5 w-3.5 text-primary" />
                        </button>
                        <button
                          type="button"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-destructive/25 text-destructive hover:bg-destructive/10"
                          onClick={() => onRemoveFromCart(item.productId)}
                          data-testid={`button-remove-${item.productId}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold text-primary">{formatCurrency(item.priceAtSale * item.quantity)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="shrink-0 space-y-4 border-t border-border bg-muted/15 p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span data-testid="text-subtotal">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm items-center">
              <span className="text-muted-foreground flex items-center gap-2">
                Descontos
                {canApplyDiscount && cart.length > 0 && (
                  <Dialog open={discountOpen} onOpenChange={onDiscountOpenChange}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-5 w-5 text-primary" data-testid="button-open-discount">
                        <Plus className="h-3 w-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-sm">
                      <DialogHeader>
                        <DialogTitle>Aplicar Desconto</DialogTitle>
                        <DialogDescription>Defina o valor ou porcentagem.</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="flex gap-2">
                          <Button
                            variant={discountType === 'percentage' ? 'default' : 'outline'}
                            className="flex-1"
                            onClick={() => onDiscountTypeChange('percentage')}
                            data-testid="button-discount-percentage"
                          >
                            <Percent className="h-4 w-4 mr-2" /> % Porcentagem
                          </Button>
                          <Button
                            variant={discountType === 'fixed' ? 'default' : 'outline'}
                            className="flex-1"
                            onClick={() => onDiscountTypeChange('fixed')}
                            data-testid="button-discount-fixed"
                          >
                            <Banknote className="h-4 w-4 mr-2" /> MT Fixo
                          </Button>
                        </div>
                        <div className="grid gap-2">
                          <Label>Valor do Desconto</Label>
                          <Input
                            type="number"
                            value={discountValue}
                            onChange={(e) => onDiscountValueChange(Number(e.target.value))}
                            data-testid="input-discount-value"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={onApplyDiscount} data-testid="button-apply-discount">Aplicar</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </span>
              <span className="text-green-600" data-testid="text-discount">-{formatCurrency(discountAmount)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-primary pt-2 border-t border-border">
              <span>Total</span>
              <span data-testid="text-total">{formatCurrency(cartTotal)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onClearCart()}
              disabled={cart.length === 0}
              data-testid="button-clear-cart"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Limpar
            </Button>
            <Button
              className="w-full font-bold shadow-md shadow-[#B71C1C]/20"
              disabled={cart.length === 0}
              onClick={onOpenCheckout}
              data-testid="button-checkout"
            >
              Finalizar
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
