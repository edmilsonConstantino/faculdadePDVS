import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Plus, Minus, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { CartItem } from './ProductBrowser';

export interface CartSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cart: CartItem[];
  total: number;
  onRemoveFromCart: (productId: string) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onGoToCheckout: () => void;
  formatQuantityDisplay: (item: CartItem) => string;
}

export function CartSheet({
  open,
  onOpenChange,
  cart,
  total,
  onRemoveFromCart,
  onUpdateQuantity,
  onGoToCheckout,
  formatQuantityDisplay,
}: CartSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92dvh] overflow-y-auto rounded-t-[2rem] border-0 border-t border-border/70 bg-white p-0 shadow-xl md:hidden"
      >
        <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-muted-foreground/25" aria-hidden />
        <div className="px-5 pb-6 pt-4">
          <SheetHeader className="space-y-1 text-left">
            <SheetTitle className="font-heading text-2xl font-black">Seu carrinho</SheetTitle>
            <SheetDescription className="text-sm font-medium">
              Ajuste quantidades e finalize.
            </SheetDescription>
          </SheetHeader>

          {cart.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-border p-8 text-center">
              <p className="text-sm font-semibold text-muted-foreground">Carrinho vazio</p>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.productId} className="rounded-3xl border border-border/70 bg-muted/10 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-gray-900">{item.product?.name}</p>
                        <p className="text-xs font-semibold text-muted-foreground">
                          {formatCurrency(item.priceAtSale)} · {item.product?.unit?.toUpperCase()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemoveFromCart(item.productId)}
                        className="h-9 w-9 rounded-2xl"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            onUpdateQuantity(
                              item.productId,
                              item.quantity - (item.product?.unit === 'kg' || item.product?.unit === 'g' ? 100 : 1),
                            )
                          }
                          className="h-10 w-10 rounded-2xl"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <div className="min-w-[90px] text-center">
                          <p className="text-sm font-black">{formatQuantityDisplay(item)}</p>
                          <p className="text-[11px] font-semibold text-muted-foreground">Quantidade</p>
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            onUpdateQuantity(
                              item.productId,
                              item.quantity + (item.product?.unit === 'kg' || item.product?.unit === 'g' ? 100 : 1),
                            )
                          }
                          className="h-10 w-10 rounded-2xl"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm font-black text-[#B71C1C]">
                        {formatCurrency(item.priceAtSale * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-end justify-between">
                  <span className="text-sm font-bold uppercase tracking-wide text-gray-500">Total</span>
                  <span className="text-2xl font-black text-[#B71C1C]">{formatCurrency(total)}</span>
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    onGoToCheckout();
                  }}
                  className="mt-3 h-12 w-full rounded-2xl bg-[#B71C1C] hover:bg-[#9b1414] font-bold"
                >
                  Finalizar pedido
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
