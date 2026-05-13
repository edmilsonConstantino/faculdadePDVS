import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Scale,
  List,
  LayoutGrid,
  Camera,
  Smartphone,
  History,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { type Product } from '@/lib/api';
import type { CartItem } from '@/lib/cart';
import { scannerApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

const POS_LIST_VIRTUAL_MIN = 72;

function formatStockRemaining(unit: string, n: number): string {
  if (unit === 'kg') return n.toFixed(3);
  if (unit === 'g') return String(Math.round(n));
  return String(Math.max(0, Math.round(n)));
}

export interface StockPreview {
  productId: string;
  remaining: number;
  unit: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface ProductSelectorProps {
  products: Product[];
  filteredProducts: Product[];
  categories: Category[];
  cart: CartItem[];
  search: string;
  selectedCategory: string | 'all';
  viewMode: 'grid' | 'list';
  stockPreview: StockPreview | null;
  recentProducts: Product[];
  isMobileViewport: boolean;
  productsFetching: boolean;
  productsLoading: boolean;
  cartSheetOpen: boolean;
  scannerToken: string | null;
  onSearchChange: (value: string) => void;
  onCategoryChange: (cat: string | 'all') => void;
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onAddProduct: (product: Product) => void;
  onQuantityChange: (productId: string, delta: number) => void;
  onCameraScanOpen: () => void;
  onRemoteScannerOpen: () => void;
  onScannerTokenChange: (token: string, url: string) => void;
  barcodeInputRef: React.RefObject<HTMLInputElement | null>;
}

export function ProductSelector({
  products,
  filteredProducts,
  categories,
  cart,
  search,
  selectedCategory,
  viewMode,
  stockPreview,
  recentProducts,
  isMobileViewport,
  productsFetching,
  productsLoading,
  cartSheetOpen,
  scannerToken,
  onSearchChange,
  onCategoryChange,
  onViewModeChange,
  onAddProduct,
  onQuantityChange,
  onCameraScanOpen,
  onRemoteScannerOpen,
  onScannerTokenChange,
  barcodeInputRef,
}: ProductSelectorProps) {
  const listScrollRef = useRef<HTMLDivElement>(null);
  const useListVirtual = viewMode === 'list' && filteredProducts.length >= POS_LIST_VIRTUAL_MIN;
  const rowVirtualizer = useVirtualizer({
    count: useListVirtual ? filteredProducts.length : 0,
    getScrollElement: () => listScrollRef.current,
    estimateSize: () => 70,
    overscan: 14,
  });

  const listRowInner = (product: Product) => {
    const parsedStock = parseFloat(product.stock);
    const parsedMin = parseFloat(product.minStock);
    const parsedPrice = parseFloat(product.price);
    const cartItem = cart.find((i) => i.productId === product.id);
    const inCartQty = cartItem?.quantity ?? 0;
    const disponivel = Math.max(0, Number((parsedStock - inCartQty).toFixed(4)));
    const qty = cartItem ? cartItem.quantity.toFixed(product.unit === 'kg' ? 1 : 0) : '0';
    const isLowStock = parsedStock > 0 && parsedStock <= parsedMin;
    const showPreview = stockPreview?.productId === product.id;
    return (
      <div
        className={cn(
          'flex min-h-[56px] w-full items-stretch overflow-hidden rounded-xl border bg-white shadow-sm transition-all',
          parsedStock <= 0 && 'pointer-events-none border-gray-100 opacity-50',
          parsedStock > 0 && cartItem && 'border-gray-900/30 bg-gray-900/6 ring-1 ring-gray-900/20',
          parsedStock > 0 && !cartItem && isLowStock && 'border-amber-200 bg-amber-50/60',
          parsedStock > 0 && !cartItem && !isLowStock && 'border-gray-200 hover:border-gray-300',
        )}
        data-testid={`card-product-${product.id}`}
      >
        <div
          className={cn(
            'w-1 shrink-0 self-stretch',
            cartItem && 'bg-[#B71C1C]',
            !cartItem && isLowStock && 'bg-amber-400',
            !cartItem && !isLowStock && 'bg-transparent',
          )}
        />
        <div className="relative m-1.5 flex aspect-square w-9 shrink-0 items-center justify-center self-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
          {product.image ? (
            <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-sm font-bold text-gray-600">{product.name.charAt(0).toUpperCase()}</span>
          )}
          {parsedStock <= 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <span className="text-center text-[7px] font-bold leading-tight text-white">Esgotado</span>
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-end overflow-hidden pb-2 pr-1 pt-1">
          <p className="max-w-[120px] truncate text-xs font-semibold leading-tight text-gray-800">{product.name}</p>
          <div className="mt-0.5 flex items-center gap-1">
            <span className="text-xs font-bold text-[#CC2936]">{formatCurrency(parsedPrice)}</span>
            <span className="shrink-0 text-[9px] text-gray-400">/{product.unit}</span>
            {product.unit === 'kg' && <Scale className="h-2.5 w-2.5 shrink-0 text-accent" />}
          </div>
          {isLowStock && parsedStock > 0 && (
            <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-800 dark:text-amber-200">
              Stock baixo
            </p>
          )}
          {showPreview && parsedStock > 0 && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1 text-[10px] font-bold tabular-nums text-primary"
            >
              Ficam {formatStockRemaining(product.unit, stockPreview!.remaining)} {product.unit} no armazém
            </motion.p>
          )}
        </div>
        <div className="flex w-[72px] shrink-0 flex-col items-center gap-0.5 self-center pr-2" onClick={(e) => e.stopPropagation()}>
          <div className="flex w-full items-center justify-end gap-1">
            {cartItem && (
              <>
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-[#B71C1C] transition-colors active:scale-95"
                  onClick={() => onQuantityChange(product.id, -1)}
                  data-testid={`button-decrease-list-${product.id}`}
                >
                  <Minus className="h-3 w-3 text-white" />
                </button>
                <span className="w-5 text-center text-xs font-bold tabular-nums text-primary">{qty}</span>
              </>
            )}
            <button
              type="button"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#B71C1C] text-white shadow-sm transition-all hover:bg-[#C62828] active:scale-95 disabled:opacity-40"
              onClick={(e) => {
                e.stopPropagation();
                if (disponivel > 0) onAddProduct(product);
              }}
              disabled={disponivel <= 0}
              data-testid={`button-add-${product.id}`}
            >
              <Plus className="h-3 w-3 text-white" />
            </button>
          </div>
          <span className="w-full text-center text-[9px] font-semibold tabular-nums text-gray-400">
            Disp.:{formatStockRemaining(product.unit, disponivel)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm lg:rounded-3xl">
      {/* Header vermelho + search — bloco sticky */}
      <div className="sticky top-0 z-30 shrink-0 lg:static lg:z-0">
        <div className="bg-[#B71C1C] px-3 py-2.5 sm:px-4 sm:py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/25">
                <ShoppingCart className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-extrabold leading-tight tracking-tight text-white">
                  PDV
                  <span className="hidden font-normal opacity-60 sm:inline"> — Ponto de Venda</span>
                </h2>
                <p className="text-[10px] font-medium text-white/50 sm:hidden">Ponto de Venda</p>
              </div>
            </div>
            {/* Toggle Lista/Grade */}
            <div className="flex shrink-0 gap-0.5 rounded-lg border border-white/20 bg-white/10 p-0.5">
              <button
                type="button"
                className={cn(
                  'flex items-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-bold transition-all',
                  viewMode === 'list' ? 'bg-white text-[#CC2936] shadow-sm' : 'text-white hover:bg-white/15',
                )}
                onClick={() => onViewModeChange('list')}
                data-testid="button-view-list"
              >
                <List className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Lista</span>
              </button>
              <button
                type="button"
                className={cn(
                  'flex items-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-bold transition-all',
                  viewMode === 'grid' ? 'bg-white text-[#CC2936] shadow-sm' : 'text-white hover:bg-white/15',
                )}
                onClick={() => onViewModeChange('grid')}
                data-testid="button-view-grid"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Grade</span>
              </button>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-100 bg-white px-3 pb-2.5 pt-2.5 sm:px-4">
          {/* Search + câmera em linha no mobile */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" strokeWidth={2.5} />
              <Input
                placeholder="Nome, SKU ou barcode..."
                className="h-9 rounded-xl border-gray-200 bg-gray-50 pl-9 pr-16 text-sm font-medium placeholder:text-gray-400 focus-visible:border-[#B71C1C]/40 focus-visible:ring-[#B71C1C]/15"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                ref={barcodeInputRef}
                data-testid="input-search-products"
              />
              {/* count inline */}
              <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-[10px] tabular-nums">
                {productsFetching && !productsLoading && <Sparkles className="h-2.5 w-2.5 animate-pulse text-[#CC2936]" />}
                <span className="font-semibold text-gray-500">{filteredProducts.length}</span>
                <span className="text-gray-300">/</span>
                <span className="text-gray-400">{products.length}</span>
              </div>
            </div>
            {/* Botão câmera compacto */}
            <button
              type="button"
              title="Ler código de barras"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#B71C1C] text-white shadow-sm transition hover:bg-[#C62828] active:scale-95"
              onClick={onCameraScanOpen}
            >
              <Camera className="h-4 w-4" />
            </button>
            {!isMobileViewport && (
              <button
                type="button"
                className={cn(
                  'flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold shadow-sm transition active:scale-[0.98]',
                  scannerToken
                    ? 'border-[#B71C1C] bg-[#B71C1C]/8 text-[#B71C1C] hover:bg-[#B71C1C]/15'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50',
                )}
                onClick={async () => {
                  if (scannerToken) { onRemoteScannerOpen(); return; }
                  try {
                    const { token, url } = await scannerApi.start();
                    onScannerTokenChange(token, url);
                    onRemoteScannerOpen();
                  } catch {
                    toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível gerar o link' });
                  }
                }}
              >
                <Smartphone className="h-4 w-4" />
                {scannerToken ? 'Scanner remoto' : 'Outro telemóvel'}
              </button>
            )}
            <div className="ml-auto hidden items-center gap-1.5 text-[11px] text-gray-400 sm:flex">
              <kbd className="rounded border border-gray-200 bg-gray-100 px-1.5 py-px font-mono text-[10px] font-semibold text-gray-500">/</kbd>
              <span>foca</span>
            </div>
          </div>

          {/* Câmera — label em mobile abaixo do search */}
          {isMobileViewport && (
            <button
              type="button"
              className="mt-2 flex w-full items-center justify-between gap-2 rounded-xl border border-[#B71C1C]/20 bg-[#B71C1C]/5 px-3 py-2 text-xs font-semibold text-[#B71C1C] transition hover:bg-[#B71C1C]/10 active:scale-[0.98]"
              onClick={onCameraScanOpen}
            >
              <div className="flex items-center gap-2">
                <Camera className="h-3.5 w-3.5" />
                Ler código de barras — câmera
              </div>
              <ChevronRight className="h-3.5 w-3.5 opacity-60" />
            </button>
          )}

          {!isMobileViewport && recentProducts.length > 0 && (
            <div className="mt-2.5 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
              <p className="mb-1.5 flex items-center gap-1.5 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-gray-400">
                <History className="h-3 w-3" />
                Recentes
              </p>
              <div className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {recentProducts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="max-w-[9rem] shrink-0 truncate rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-left text-[11px] font-semibold text-gray-700 shadow-sm transition hover:border-[#B71C1C]/30 hover:bg-[#B71C1C]/5 hover:text-[#B71C1C]"
                    onClick={() => onAddProduct(p)}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-2.5 flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              className={cn(
                'h-8 shrink-0 rounded-lg px-3.5 text-[11px] font-bold tracking-wide transition-all',
                selectedCategory === 'all'
                  ? 'bg-[#B71C1C] text-white shadow-sm'
                  : 'border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50',
              )}
              onClick={() => onCategoryChange('all')}
              data-testid="button-category-all"
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={cn(
                  'h-8 shrink-0 whitespace-nowrap rounded-lg px-3.5 text-[11px] font-bold tracking-wide transition-all',
                  selectedCategory === cat.id
                    ? 'bg-[#B71C1C] text-white shadow-sm'
                    : 'border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50',
                )}
                onClick={() => onCategoryChange(cat.id)}
                data-testid={`button-category-${cat.id}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>{/* fim bloco sticky */}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div
          ref={listScrollRef}
          className={cn(
            'flex-1 overflow-y-auto overscroll-contain p-1.5 lg:p-4',
            isMobileViewport && cart.length > 0 && !cartSheetOpen
              ? 'pb-[calc(7.25rem+env(safe-area-inset-bottom,0px))]'
              : '',
          )}
        >
          {viewMode === 'list' ? (
            useListVirtual ? (
              <div className="relative w-full" style={{ height: rowVirtualizer.getTotalSize() }}>
                {rowVirtualizer.getVirtualItems().map((vi) => {
                  const product = filteredProducts[vi.index];
                  return (
                    <div
                      key={vi.key}
                      className="absolute left-0 top-0 w-full"
                      style={{ transform: `translateY(${vi.start}px)` }}
                    >
                      <div className="pb-1.5">{listRowInner(product)}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-1.5">
                {filteredProducts.map((product) => (
                  <div key={product.id}>{listRowInner(product)}</div>
                ))}
              </div>
            )
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 lg:gap-4">
              {filteredProducts.map((product) => {
                const parsedStock = parseFloat(product.stock);
                const parsedMinStock = parseFloat(product.minStock);
                const parsedPrice = parseFloat(product.price);
                const cartItem = cart.find((i) => i.productId === product.id);
                const inCart = cartItem?.quantity ?? 0;
                const disponivel = Math.max(0, Number((parsedStock - inCart).toFixed(4)));
                const isLowStock = parsedStock > 0 && parsedStock <= parsedMinStock;

                return (
                  <Card
                    key={product.id}
                    className={cn(
                      'group rounded-xl transition-all',
                      parsedStock <= 0 && 'pointer-events-none opacity-50',
                      cartItem && 'border-gray-900 shadow-md ring-2 ring-gray-900/25',
                      !cartItem && parsedStock > 0 && isLowStock && 'border-amber-400/80 bg-amber-50/40 dark:border-amber-700/60 dark:bg-amber-950/25',
                      !cartItem && parsedStock > 0 && !isLowStock && 'cursor-pointer hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg',
                      !cartItem && parsedStock > 0 && isLowStock && 'cursor-pointer hover:-translate-y-0.5 hover:border-amber-500/60 hover:shadow-md',
                    )}
                    onClick={() => !cartItem && disponivel > 0 && onAddProduct(product)}
                    data-testid={`card-product-${product.id}`}
                  >
                    <CardContent className="p-2 lg:p-3 space-y-2">
                      <div className="relative aspect-square overflow-hidden rounded-xl border border-[#B71C1C]/10 bg-[#B71C1C]/6">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={cn(
                          'flex h-full w-full items-center justify-center bg-[#B71C1C]/8 text-2xl font-black text-[#B71C1C] lg:text-3xl',
                          product.image && 'hidden',
                        )}>
                          {product.name.charAt(0).toUpperCase()}
                        </div>
                        {cartItem && (
                          <div className="absolute inset-0 flex items-end justify-center bg-[#B71C1C]/10 pb-2">
                            <div className="rounded-full bg-[#B71C1C] px-2 py-0.5 text-xs font-bold text-white shadow-sm">
                              {cartItem.quantity.toFixed(product.unit === 'kg' ? 1 : 0)} {product.unit}
                            </div>
                          </div>
                        )}
                        {parsedStock <= parsedMinStock && parsedStock > 0 && (
                          <Badge className="absolute top-2 right-2 text-[10px] px-1.5 h-5 bg-amber-600 hover:bg-amber-700">Pouco</Badge>
                        )}
                        {parsedStock <= 0 && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                            <span className="text-white font-bold text-sm">Sem Estoque</span>
                          </div>
                        )}
                        {product.unit === 'kg' && (
                          <Badge variant="secondary" className="absolute bottom-2 left-2 text-[10px] bg-white/90 backdrop-blur text-foreground border-none shadow-sm">
                            <Scale className="h-3 w-3 mr-1" /> Pesável
                          </Badge>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-xs lg:text-sm leading-tight line-clamp-2 text-gray-800">{product.name}</h3>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-bold text-primary lg:text-base">{formatCurrency(parsedPrice)}</span>
                          <Badge variant="outline" className="text-[10px]">{product.unit}</Badge>
                        </div>
                        {cartItem ? (
                          <>
                            <div className="flex items-center justify-between mt-2 gap-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                className="flex h-7 flex-1 items-center justify-center rounded-lg bg-destructive/90 text-destructive-foreground transition-colors hover:bg-destructive"
                                onClick={() => onQuantityChange(product.id, -1)}
                              >
                                <Minus className="h-3 w-3 text-white" />
                              </button>
                              <span className="flex-1 text-center text-xs font-bold text-primary">
                                {cartItem.quantity.toFixed(product.unit === 'kg' ? 1 : 0)}
                              </span>
                              <button
                                type="button"
                                className="flex h-7 flex-1 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:brightness-110 disabled:opacity-40"
                                onClick={() => onQuantityChange(product.id, 1)}
                                disabled={disponivel <= 0}
                              >
                                <Plus className="h-3 w-3 text-white" />
                              </button>
                            </div>
                            <p className="mt-1 text-center text-[9px] font-semibold tabular-nums text-muted-foreground">
                              Disp.: {formatStockRemaining(product.unit, disponivel)}
                            </p>
                          </>
                        ) : (
                          <div className="mt-1 text-[10px] font-semibold tabular-nums text-muted-foreground">
                            Disp.: {formatStockRemaining(product.unit, disponivel)}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
