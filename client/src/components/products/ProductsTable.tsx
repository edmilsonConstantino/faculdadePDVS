import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from '@/components/ui/button';
import { Search, AlertTriangle, Pencil, Trash2, ArrowUp, Package } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Product } from '@/lib/api';

interface Category {
  id: string;
  name: string;
  color?: string;
}

interface ProductsTableProps {
  filteredProducts: Product[];
  categories: Category[];
  search: string;
  view: 'all' | 'out' | 'low' | 'recent';
  increaseStockOpen: boolean;
  selectedProductId: string;
  increaseQuantity: string;
  increasePrice: string;
  deleteProductMutationIsPending: boolean;
  increaseStockMutationIsPending: boolean;
  onSearchChange: (value: string) => void;
  onViewChange: (view: 'all' | 'out' | 'low' | 'recent') => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onOpenIncreaseStock: (productId: string) => void;
  onCloseIncreaseStock: () => void;
  onIncreaseQuantityChange: (value: string) => void;
  onIncreasePriceChange: (value: string) => void;
  onSaveIncreaseStock: (productId: string) => void;
}

export function ProductsTable({
  filteredProducts,
  categories,
  search,
  view,
  increaseStockOpen,
  selectedProductId,
  increaseQuantity,
  increasePrice,
  deleteProductMutationIsPending,
  increaseStockMutationIsPending,
  onSearchChange,
  onViewChange,
  onEditProduct,
  onDeleteProduct,
  onOpenIncreaseStock,
  onCloseIncreaseStock,
  onIncreaseQuantityChange,
  onIncreasePriceChange,
  onSaveIncreaseStock,
}: ProductsTableProps) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white shadow-sm">
      {/* Barra de pesquisa + filtros */}
      <div className="flex flex-col gap-3 border-b border-gray-100 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar por nome ou SKU..."
            className="h-9 rounded-full border-gray-200 pl-9 text-sm focus-visible:ring-red-400/30"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            data-testid="input-search-products"
          />
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {(['all', 'out', 'low', 'recent'] as const).map((v) => {
            const labels = { all: 'Todos', out: 'Sem estoque', low: 'Abaixo do mínimo', recent: 'Recentes' };
            const active = view === v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => onViewChange(v)}
                className={`h-8 rounded-lg px-3 text-xs font-semibold transition-all ${
                  active
                    ? 'bg-gradient-to-r from-[#B71C1C] to-[#7f1d1d] text-white shadow-md shadow-[#B71C1C]/25'
                    : 'border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {labels[v]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-100 bg-gray-50/60">
              <TableHead className="text-xs font-bold uppercase tracking-wider text-gray-500">Produto</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-gray-500">Categoria</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-gray-500">Preço</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-gray-500">Estoque</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-gray-500">Unidade</TableHead>
              <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-gray-500">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => {
              const category = categories.find(c => c.id === product.categoryId);
              const parsedStock = parseFloat(product.stock);
              const parsedMinStock = parseFloat(product.minStock);

              return (
                <TableRow key={product.id} className="group border-b border-gray-50 transition-colors hover:bg-red-50/30" data-testid={`row-product-${product.id}`}>
                  <TableCell className="py-3.5 font-medium">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Package className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {parsedStock <= parsedMinStock && (
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                          )}
                          <p className="truncate font-bold leading-none text-gray-900">{product.name}</p>
                        </div>
                        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-gray-400">{product.sku}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${category?.color || 'bg-gray-100 text-gray-600'}`}>
                      {category?.name || 'Geral'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-base font-extrabold tabular-nums text-[#CC2936]">{formatCurrency(parseFloat(product.price))}</span>
                      <span className="text-[10px] tabular-nums text-gray-400">Custo: {formatCurrency(parseFloat(product.costPrice))}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={parsedStock <= parsedMinStock ? 'font-bold text-[#B71C1C]' : 'font-semibold text-gray-700'}>
                      {parsedStock}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs font-semibold uppercase text-gray-500">{product.unit}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        className="rounded-lg p-2 text-gray-400 transition-all hover:bg-white hover:text-amber-600 hover:shadow-sm"
                        onClick={() => onEditProduct(product)}
                        title="Editar produto"
                        data-testid={`button-edit-${product.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <Dialog
                        open={increaseStockOpen && selectedProductId === product.id}
                        onOpenChange={(open) => { if (!open) onCloseIncreaseStock(); }}
                      >
                        <button
                          type="button"
                          className="rounded-lg p-2 text-gray-400 transition-all hover:bg-white hover:text-[#B71C1C] hover:shadow-sm"
                          onClick={() => onOpenIncreaseStock(product.id)}
                          title="Aumentar estoque"
                          data-testid={`button-increase-stock-${product.id}`}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Aumentar Estoque: {product.name}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="grid gap-2">
                              <Label>Quantidade a Adicionar</Label>
                              <Input
                                type="number"
                                placeholder="Ex: 10"
                                value={increaseQuantity}
                                onChange={(e) => onIncreaseQuantityChange(e.target.value)}
                                data-testid="input-increase-quantity"
                              />
                              <p className="text-xs text-muted-foreground">
                                Estoque atual: {parsedStock} {product.unit}
                              </p>
                            </div>
                            <div className="grid gap-2">
                              <Label>Novo Preço (Opcional)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder={formatCurrency(parseFloat(product.price))}
                                value={increasePrice}
                                onChange={(e) => onIncreasePriceChange(e.target.value)}
                                data-testid="input-increase-price"
                              />
                              <p className="text-xs text-muted-foreground">
                                Preço atual: {formatCurrency(parseFloat(product.price))}
                              </p>
                            </div>
                            <Button
                              onClick={() => onSaveIncreaseStock(product.id)}
                              disabled={increaseStockMutationIsPending || !increaseQuantity}
                              className="w-full"
                              data-testid="button-save-increase-stock"
                            >
                              {increaseStockMutationIsPending ? 'Atualizando...' : 'Aumentar Estoque'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <button
                        type="button"
                        className="rounded-lg p-2 text-gray-400 transition-all hover:bg-white hover:text-red-600 hover:shadow-sm disabled:opacity-50"
                        onClick={() => onDeleteProduct(product.id)}
                        disabled={deleteProductMutationIsPending}
                        title="Eliminar produto"
                        data-testid={`button-delete-${product.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
