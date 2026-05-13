import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Camera, Package, AlertCircle } from 'lucide-react';
import { Product } from '@/lib/api';

interface Category {
  id: string;
  name: string;
  color?: string;
}

interface EditCount {
  count: number;
  limit: number;
  canEdit: boolean;
}

interface NewProductState {
  name: string;
  sku: string;
  barcode: string;
  price: string;
  costPrice: string;
  stock: string;
  unit: 'un' | 'kg' | 'g' | 'pack' | 'box';
  categoryId: string;
  minStock: string;
  image: string;
}

interface NewCategoryState {
  name: string;
  color: string;
}

// ── ADD PRODUCT FORM ──────────────────────────────────────────────────────────

interface ProductAddFormProps {
  isAddOpen: boolean;
  newProduct: NewProductState;
  categories: Category[];
  editCount: EditCount | undefined;
  isCategoryDialogOpen: boolean;
  newCategory: NewCategoryState;
  createProductMutationIsPending: boolean;
  createCategoryMutationIsPending: boolean;
  onAddOpenChange: (open: boolean) => void;
  onNewProductChange: (product: NewProductState) => void;
  onCategoryDialogOpenChange: (open: boolean) => void;
  onNewCategoryChange: (category: NewCategoryState) => void;
  onSaveProduct: () => void;
  onCreateCategory: () => void;
  onBarcodeScanOpen: () => void;
}

export function ProductAddForm({
  isAddOpen,
  newProduct,
  categories,
  editCount,
  isCategoryDialogOpen,
  newCategory,
  createProductMutationIsPending,
  createCategoryMutationIsPending,
  onAddOpenChange,
  onNewProductChange,
  onCategoryDialogOpenChange,
  onNewCategoryChange,
  onSaveProduct,
  onCreateCategory,
  onBarcodeScanOpen,
}: ProductAddFormProps) {
  return (
    <Dialog open={isAddOpen} onOpenChange={onAddOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-[#B71C1C] shadow-md shadow-black/20 transition hover:bg-gray-50 active:scale-[0.98]"
          data-testid="button-add-product"
        >
          <Plus className="h-3.5 w-3.5" />
          Novo Produto
        </button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100%-2rem)] max-w-2xl overflow-hidden rounded-[2rem] border-none bg-white p-0 shadow-2xl">
        {/* Header */}
        <div className="relative overflow-hidden rounded-t-[2rem] bg-[#B71C1C] px-5 py-4 sm:px-6 sm:py-5">
          <div className="banner-texture" />
          <div className="relative flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
              <Package className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <DialogTitle className="text-sm font-extrabold text-white sm:text-base">Novo Produto</DialogTitle>
              <p className="text-[11px] text-white/60">Preencha os detalhes para registar no inventário.</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="max-h-[65vh] space-y-5 overflow-y-auto px-5 py-4 sm:px-6 sm:py-5">

          {editCount && !editCount.canEdit && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Você atingiu o limite de {editCount.limit} edições diárias. Você já fez {editCount.count} edições hoje.
              </AlertDescription>
            </Alert>
          )}

          {/* Seção: Identificação */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-4 w-1 rounded-full bg-[#B71C1C]" />
              <h3 className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">Informações Básicas</h3>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="ml-1 text-xs font-bold text-gray-600">Nome do Produto</Label>
                <Input
                  className="h-11 rounded-xl border-gray-200 focus-visible:border-[#B71C1C]/40 focus-visible:ring-[#B71C1C]/15"
                  placeholder="Ex: Coca-Cola 2L"
                  value={newProduct.name}
                  onChange={e => onNewProductChange({ ...newProduct, name: e.target.value })}
                  data-testid="input-product-name"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="ml-1 text-xs font-bold text-gray-600">Código (SKU)</Label>
                <Input
                  className="h-11 rounded-xl border-gray-200 bg-gray-50/60 focus-visible:border-[#B71C1C]/40 focus-visible:ring-[#B71C1C]/15"
                  placeholder="Gerado automaticamente se vazio"
                  value={newProduct.sku}
                  onChange={e => onNewProductChange({ ...newProduct, sku: e.target.value })}
                  data-testid="input-product-sku"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="ml-1 text-xs font-bold text-gray-600">Código de Barras <span className="font-normal text-gray-400">(opcional)</span></Label>
              <div className="flex gap-2">
                <Input
                  className="h-11 flex-1 rounded-xl border-gray-200 focus-visible:border-[#B71C1C]/40 focus-visible:ring-[#B71C1C]/15"
                  placeholder="EAN-13, UPC — ou use o botão para escanear"
                  value={newProduct.barcode}
                  onChange={e => onNewProductChange({ ...newProduct, barcode: e.target.value })}
                  data-testid="input-product-barcode"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-11 shrink-0 rounded-xl border-gray-200 p-0 hover:border-[#B71C1C]/30 hover:bg-[#B71C1C]/5 hover:text-[#B71C1C]"
                  onClick={onBarcodeScanOpen}
                  title="Escanear código de barras"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <p className="ml-1 text-[11px] text-gray-400">SKU e barcode são ambos aceites no scanner — o sistema gera automaticamente se vazio.</p>
            </div>
          </section>

          {/* Seção: Valores */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-4 w-1 rounded-full bg-[#B71C1C]" />
              <h3 className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">Valores e Quantidades</h3>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="ml-1 text-xs font-bold text-[#B71C1C]">Preço Venda (MT)</Label>
                <Input
                  type="number"
                  className="h-11 rounded-xl border-red-100 bg-red-50/40 text-base font-bold text-[#B71C1C] focus-visible:border-[#B71C1C]/50 focus-visible:ring-[#B71C1C]/20"
                  value={newProduct.price}
                  onChange={e => onNewProductChange({ ...newProduct, price: e.target.value })}
                  data-testid="input-product-price"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="ml-1 text-xs font-bold text-gray-600">Preço Custo (MT)</Label>
                <Input
                  type="number"
                  className="h-11 rounded-xl border-gray-200 focus-visible:border-[#B71C1C]/40 focus-visible:ring-[#B71C1C]/15"
                  value={newProduct.costPrice}
                  onChange={e => onNewProductChange({ ...newProduct, costPrice: e.target.value })}
                  data-testid="input-product-cost"
                />
              </div>
              <div className="col-span-2 space-y-1.5 sm:col-span-1">
                <Label className="ml-1 text-xs font-bold text-gray-600">Unidade de Medida</Label>
                <Select
                  value={newProduct.unit}
                  onValueChange={(val: any) => onNewProductChange({ ...newProduct, unit: val })}
                >
                  <SelectTrigger className="h-11 rounded-xl border-gray-200" data-testid="select-product-unit">
                    <SelectValue placeholder="Unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="un">Unidade (un)</SelectItem>
                    <SelectItem value="kg">Quilograma (kg)</SelectItem>
                    <SelectItem value="g">Grama (g)</SelectItem>
                    <SelectItem value="pack">Pacote</SelectItem>
                    <SelectItem value="box">Caixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="ml-1 text-xs font-bold text-gray-600">Estoque Inicial</Label>
                <Input
                  type="number"
                  className="h-11 rounded-xl border-gray-200 font-bold focus-visible:border-[#B71C1C]/40 focus-visible:ring-[#B71C1C]/15"
                  value={newProduct.stock}
                  onChange={e => onNewProductChange({ ...newProduct, stock: e.target.value })}
                  data-testid="input-product-stock"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="ml-1 text-xs font-bold text-gray-600">Estoque Mínimo <span className="font-normal text-gray-400">(alerta)</span></Label>
                <Input
                  type="number"
                  className="h-11 rounded-xl border-gray-200 focus-visible:border-[#B71C1C]/40 focus-visible:ring-[#B71C1C]/15"
                  value={newProduct.minStock}
                  onChange={e => onNewProductChange({ ...newProduct, minStock: e.target.value })}
                  data-testid="input-product-minstock"
                />
              </div>
            </div>
          </section>

          {/* Seção: Categoria e Imagem */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-4 w-1 rounded-full bg-[#B71C1C]" />
              <h3 className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">Categoria e Imagem</h3>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="ml-1 text-xs font-bold text-gray-600">Categoria</Label>
                <div className="flex gap-2">
                  <Select
                    value={newProduct.categoryId}
                    onValueChange={(val) => onNewProductChange({ ...newProduct, categoryId: val })}
                  >
                    <SelectTrigger className="h-11 flex-1 rounded-xl border-gray-200" data-testid="select-product-category">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Dialog open={isCategoryDialogOpen} onOpenChange={onCategoryDialogOpenChange}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon" type="button" className="h-11 w-11 shrink-0 rounded-xl border-gray-200 hover:border-[#B71C1C]/30 hover:bg-[#B71C1C]/5 hover:text-[#B71C1C]">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Nova Categoria</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Nome da Categoria</Label>
                          <Input
                            value={newCategory.name}
                            onChange={(e) => onNewCategoryChange({ ...newCategory, name: e.target.value })}
                            placeholder="Ex: Bebidas, Limpeza..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Cor da Categoria</Label>
                          <Select
                            value={newCategory.color}
                            onValueChange={(val) => onNewCategoryChange({ ...newCategory, color: val })}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bg-blue-100 text-blue-800">Azul</SelectItem>
                              <SelectItem value="bg-green-100 text-green-800">Verde</SelectItem>
                              <SelectItem value="bg-yellow-100 text-yellow-800">Amarelo</SelectItem>
                              <SelectItem value="bg-red-100 text-red-800">Vermelho</SelectItem>
                              <SelectItem value="bg-purple-100 text-purple-800">Roxo</SelectItem>
                              <SelectItem value="bg-orange-100 text-orange-800">Laranja</SelectItem>
                              <SelectItem value="bg-pink-100 text-pink-800">Rosa</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Button
                        onClick={onCreateCategory}
                        disabled={!newCategory.name || createCategoryMutationIsPending}
                      >
                        {createCategoryMutationIsPending ? 'Criando...' : 'Criar Categoria'}
                      </Button>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="ml-1 text-xs font-bold text-gray-600">URL da Imagem <span className="font-normal text-gray-400">(opcional)</span></Label>
                <Input
                  className="h-11 rounded-xl border-gray-200 focus-visible:border-[#B71C1C]/40 focus-visible:ring-[#B71C1C]/15"
                  placeholder="https://exemplo.com/imagem.jpg"
                  value={newProduct.image}
                  onChange={e => onNewProductChange({ ...newProduct, image: e.target.value })}
                  data-testid="input-product-image"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4 sm:px-6">
          <Button
            className="h-13 w-full rounded-2xl bg-gradient-to-r from-[#B71C1C] to-[#7f1d1d] text-base font-bold text-white shadow-lg shadow-[#B71C1C]/20 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
            onClick={onSaveProduct}
            disabled={createProductMutationIsPending || (editCount !== undefined && !editCount.canEdit)}
            data-testid="button-save-product"
          >
            {createProductMutationIsPending ? 'A guardar...' : 'Salvar Produto'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── EDIT PRODUCT FORM ─────────────────────────────────────────────────────────

interface ProductEditFormProps {
  isEditOpen: boolean;
  editingProduct: Product | null;
  categories: Category[];
  updateProductMutationIsPending: boolean;
  onEditOpenChange: (open: boolean) => void;
  onEditingProductChange: (product: Product) => void;
  onSaveEdit: () => void;
  onBarcodeScanOpen: () => void;
}

export function ProductEditForm({
  isEditOpen,
  editingProduct,
  categories,
  updateProductMutationIsPending,
  onEditOpenChange,
  onEditingProductChange,
  onSaveEdit,
  onBarcodeScanOpen,
}: ProductEditFormProps) {
  return (
    <Dialog open={isEditOpen} onOpenChange={onEditOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-2xl max-h-[90dvh] overflow-y-auto rounded-[2rem] border-none p-0 shadow-2xl">
        {/* cabeçalho */}
        <div className="relative overflow-hidden rounded-t-[2rem] bg-[#B71C1C] px-5 py-4 sm:px-6 sm:py-5">
          <div className="banner-texture" />
          <div className="relative flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
              <Package className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <DialogTitle className="text-sm font-extrabold text-white sm:text-base">Editar Produto</DialogTitle>
              <p className="text-[11px] text-white/60">{editingProduct?.name}</p>
            </div>
          </div>
        </div>

        {editingProduct && (
          <div className="space-y-4 px-5 py-4 sm:px-6 sm:py-5">
            {/* Identificação */}
            <div className="flex items-center gap-2">
              <span className="h-4 w-1 rounded-full bg-[#B71C1C]" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Identificação</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Nome</Label>
                <Input value={editingProduct.name} onChange={e => onEditingProductChange({ ...editingProduct, name: e.target.value })} data-testid="input-edit-product-name" className="h-10 rounded-xl border-gray-200 bg-gray-50" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">SKU</Label>
                <Input value={editingProduct.sku} onChange={e => onEditingProductChange({ ...editingProduct, sku: e.target.value })} data-testid="input-edit-product-sku" className="h-10 rounded-xl border-gray-200 bg-gray-50" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Código de barras</Label>
              <div className="flex gap-2">
                <Input value={(editingProduct as any).barcode || ''} onChange={e => onEditingProductChange({ ...editingProduct, barcode: e.target.value } as any)} placeholder="EAN-13, UPC…" data-testid="input-edit-product-barcode" className="h-10 flex-1 rounded-xl border-gray-200 bg-gray-50" />
                <Button type="button" variant="outline" size="icon" onClick={onBarcodeScanOpen} title="Escanear" className="h-10 w-10 rounded-xl border-gray-200">
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Preços */}
            <div className="flex items-center gap-2 pt-1">
              <span className="h-4 w-1 rounded-full bg-[#B71C1C]" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Preços & Stock</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Preço venda</Label>
                <Input type="number" value={editingProduct.price} onChange={e => onEditingProductChange({ ...editingProduct, price: e.target.value })} data-testid="input-edit-product-price" className="h-10 rounded-xl border-gray-200 bg-gray-50" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Preço custo</Label>
                <Input type="number" value={editingProduct.costPrice} onChange={e => onEditingProductChange({ ...editingProduct, costPrice: e.target.value })} data-testid="input-edit-product-cost" className="h-10 rounded-xl border-gray-200 bg-gray-50" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Stock actual</Label>
                <Input type="number" value={editingProduct.stock} onChange={e => onEditingProductChange({ ...editingProduct, stock: e.target.value })} data-testid="input-edit-product-stock" className="h-10 rounded-xl border-gray-200 bg-gray-50" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Stock mínimo</Label>
                <Input type="number" value={editingProduct.minStock} onChange={e => onEditingProductChange({ ...editingProduct, minStock: e.target.value })} data-testid="input-edit-product-minstock" className="h-10 rounded-xl border-gray-200 bg-gray-50" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Unidade</Label>
                <Select value={editingProduct.unit} onValueChange={(val) => onEditingProductChange({ ...editingProduct, unit: val as any })}>
                  <SelectTrigger data-testid="select-edit-product-unit" className="h-10 rounded-xl border-gray-200 bg-gray-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="un">Un</SelectItem>
                    <SelectItem value="kg">Kg</SelectItem>
                    <SelectItem value="g">g</SelectItem>
                    <SelectItem value="pack">Pack</SelectItem>
                    <SelectItem value="box">Box</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Categoria & Imagem */}
            <div className="flex items-center gap-2 pt-1">
              <span className="h-4 w-1 rounded-full bg-[#B71C1C]" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Categoria & Imagem</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Categoria</Label>
                <Select value={editingProduct.categoryId || ''} onValueChange={(val) => onEditingProductChange({ ...editingProduct, categoryId: val })}>
                  <SelectTrigger data-testid="select-edit-product-category" className="h-10 rounded-xl border-gray-200 bg-gray-50">
                    <SelectValue placeholder="Selecione…" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">URL imagem</Label>
                <Input value={editingProduct.image || ''} onChange={e => onEditingProductChange({ ...editingProduct, image: e.target.value })} placeholder="https://…" data-testid="input-edit-product-image" className="h-10 rounded-xl border-gray-200 bg-gray-50" />
              </div>
            </div>
          </div>
        )}

        {/* rodapé */}
        <div className="flex items-center justify-end gap-2 border-t border-gray-100 bg-gray-50/60 px-5 py-4 rounded-b-[2rem] sm:px-6">
          <button type="button" onClick={() => onEditOpenChange(false)} className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancelar</button>
          <button type="button" onClick={onSaveEdit} disabled={updateProductMutationIsPending} data-testid="button-save-edit-product" className="rounded-xl bg-gradient-to-r from-[#B71C1C] to-[#7f1d1d] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-60">
            {updateProductMutationIsPending ? 'A guardar...' : 'Guardar alterações'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
