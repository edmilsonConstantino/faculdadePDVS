import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Package, Search, Plus, Minus, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Product, Category } from '@/lib/api';

export interface CartItem {
  productId: string;
  product?: Product;
  quantity: number;
  priceAtSale: number;
}

export interface ProductBrowserProps {
  filteredProducts: Product[];
  directMatches: Product[];
  fuzzySuggestions: Product[];
  categories: Category[];
  cart: CartItem[];
  total: number;
  productSearch: string;
  selectedCategory: string;
  onProductSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onAddToCart: (product: Product) => void;
  onRemoveFromCart: (productId: string) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onGoToCheckout: () => void;
  formatQuantityDisplay: (item: CartItem) => string;
}

export function ProductBrowser({
  filteredProducts,
  directMatches,
  categories,
  cart,
  total,
  productSearch,
  selectedCategory,
  onProductSearchChange,
  onCategoryChange,
  onAddToCart,
  onRemoveFromCart,
  onUpdateQuantity,
  onGoToCheckout,
  formatQuantityDisplay,
}: ProductBrowserProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {/* Products area */}
      <div className="md:col-span-2 lg:col-span-3 space-y-4">
        {/* Search bar + category */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="grid gap-3 p-4 md:grid-cols-2">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={productSearch}
                onChange={(e) => onProductSearchChange(e.target.value)}
                placeholder="Buscar (ex: água, arroz, leite)…"
                className="h-11 rounded-xl pl-10 border-gray-200 bg-gray-50 focus:bg-white"
              />
            </div>
            <Select value={selectedCategory} onValueChange={onCategoryChange}>
              <SelectTrigger className="w-full h-11 rounded-xl border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Todas as categorias</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {productSearch.trim() && directMatches.length === 0 && (
            <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
              <p className="text-sm font-semibold text-gray-700">Não encontramos "{productSearch.trim()}".</p>
              <p className="mt-0.5 text-xs text-gray-400">Tenta outro nome ou verifique a categoria.</p>
            </div>
          )}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {filteredProducts.map(product => {
            const stock = parseFloat(product.stock);
            const outOfStock = stock <= 0;
            return (
              <div key={product.id} className={`relative overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md ${outOfStock ? 'border-gray-200 opacity-60' : 'border-gray-200'}`}>
                <div className="p-3.5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-gray-900">{product.name}</p>
                      <p className="text-[11px] text-gray-400 truncate">{product.sku}</p>
                    </div>
                    <span className="shrink-0 rounded-lg border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-gray-500">{product.unit}</span>
                  </div>
                  <div className="flex items-end justify-between">
                    <p className="text-base font-black text-[#B71C1C]">{formatCurrency(parseFloat(product.price))}</p>
                    {outOfStock
                      ? <span className="rounded-lg bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">Esgotado</span>
                      : <span className="rounded-lg bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                          {product.unit === 'kg' || product.unit === 'g' ? `${stock.toFixed(2)} kg` : `${Math.floor(stock)} un.`}
                        </span>
                    }
                  </div>
                  <button
                    type="button"
                    onClick={() => onAddToCart(product)}
                    disabled={outOfStock}
                    className="flex w-full items-center justify-center rounded-xl bg-[#B71C1C] py-2.5 text-sm font-bold text-white transition hover:bg-[#9b1414] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Adicionar
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#B71C1C] to-[#7f1d1d]" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Cart Sidebar (desktop only) */}
      <div className="hidden md:block md:col-span-1">
        <div className="sticky top-4 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50/60 px-4 py-3">
            <ShoppingCart className="h-4 w-4 text-[#B71C1C]" />
            <p className="text-sm font-bold text-gray-800">Meu Carrinho</p>
            {cart.length > 0 && (
              <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-[#B71C1C] text-[10px] font-black text-white">{cart.length}</span>
            )}
          </div>
          <div className="p-4 space-y-4">
            {cart.length === 0 ? (
              <div className="py-8 text-center">
                <ShoppingCart className="mx-auto mb-2 h-8 w-8 text-gray-200" />
                <p className="text-sm font-semibold text-gray-400">Carrinho vazio</p>
              </div>
            ) : (
              <>
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto">
                  {cart.map(item => (
                    <div key={item.productId} className="rounded-xl border border-gray-100 bg-gray-50 p-3 space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <p className="text-sm font-semibold text-gray-800 leading-tight">{item.product?.name}</p>
                        <button type="button" onClick={() => onRemoveFromCart(item.productId)} className="shrink-0 rounded-lg p-0.5 text-gray-400 hover:text-red-600 transition">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <button type="button" onClick={() => onUpdateQuantity(item.productId, item.quantity - (item.product?.unit === 'kg' || item.product?.unit === 'g' ? 100 : 1))} className="flex h-6 w-6 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-gray-300">
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="min-w-[40px] text-center text-xs font-bold text-gray-800">{formatQuantityDisplay(item)}</span>
                          <button type="button" onClick={() => onUpdateQuantity(item.productId, item.quantity + (item.product?.unit === 'kg' || item.product?.unit === 'g' ? 100 : 1))} className="flex h-6 w-6 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-gray-300">
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="text-sm font-black text-[#B71C1C]">{formatCurrency(item.priceAtSale * item.quantity)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 pt-3 space-y-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span className="text-gray-600">Total:</span>
                    <span className="text-[#B71C1C]">{formatCurrency(total)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={onGoToCheckout}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#B71C1C] py-2.5 text-sm font-bold text-white transition hover:bg-[#9b1414]"
                  >
                    <Package className="h-4 w-4" />
                    Finalizar Pedido
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
