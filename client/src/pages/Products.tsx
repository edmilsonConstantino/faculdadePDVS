import { useAuth } from '@/lib/auth';
import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BarcodeCameraScan } from '@/components/BarcodeCameraScan';
import { Product, productsApi, categoriesApi, systemApi } from '@/lib/api';
import * as XLSX from 'xlsx';
import { toast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProductsHeader } from '@/components/products/ProductsHeader';
import { ProductsTable } from '@/components/products/ProductsTable';
import { ProductAddForm, ProductEditForm } from '@/components/products/ProductForm';

export default function Products() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── State ──────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'all' | 'out' | 'low' | 'recent'>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', color: 'bg-blue-100 text-blue-800' });
  const [newProduct, setNewProduct] = useState({
    name: '', sku: '', barcode: '', price: '', costPrice: '',
    stock: '', unit: 'un' as 'un' | 'kg' | 'g' | 'pack' | 'box',
    categoryId: '', minStock: '5', image: '',
  });
  const [increaseStockOpen, setIncreaseStockOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [increaseQuantity, setIncreaseQuantity] = useState('');
  const [increasePrice, setIncreasePrice] = useState('');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [barcodeScanOpen, setBarcodeScanOpen] = useState<'add' | 'edit' | null>(null);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['/api/products'], queryFn: productsApi.getAll
  });
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/categories'], queryFn: categoriesApi.getAll
  });
  const { data: editCount } = useQuery({
    queryKey: ['/api/system/edit-count'],
    queryFn: systemApi.getEditCount,
    enabled: !!user,
    retry: (failureCount, error: any) => error?.status !== 401 && failureCount < 2,
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createProductMutation = useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/system/edit-count'] });
      setIsAddOpen(false);
      setNewProduct({ name: '', sku: '', barcode: '', price: '', costPrice: '', stock: '', unit: 'un', categoryId: '', minStock: '5', image: '' });
      toast({ title: "Sucesso", description: "Produto cadastrado!" });
    },
    onError: (error: Error) => toast({ title: "Erro", description: error.message, variant: "destructive" }),
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => productsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/system/edit-count'] });
      toast({ title: "Sucesso", description: "Produto atualizado!" });
    },
    onError: (error: Error) => toast({ title: "Erro", description: error.message, variant: "destructive" }),
  });

  const deleteProductMutation = useMutation({
    mutationFn: productsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({ title: "Sucesso", description: "Produto deletado!" });
    },
    onError: (error: Error) => toast({ title: "Erro", description: error.message, variant: "destructive" }),
  });

  const increaseStockMutation = useMutation({
    mutationFn: ({ id, quantity, price }: { id: string; quantity: number; price?: number }) =>
      productsApi.increaseStock(id, quantity, price),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setIncreaseStockOpen(false);
      setSelectedProductId('');
      setIncreaseQuantity('');
      setIncreasePrice('');
      toast({ title: "Sucesso", description: "Estoque e preço atualizados!" });
    },
    onError: (error: Error) => toast({ title: "Erro", description: error.message, variant: "destructive" }),
  });

  const createCategoryMutation = useMutation({
    mutationFn: categoriesApi.create,
    onSuccess: (createdCategory) => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      setNewProduct({ ...newProduct, categoryId: createdCategory.id });
      setIsCategoryDialogOpen(false);
      setNewCategory({ name: '', color: 'bg-blue-100 text-blue-800' });
      toast({ title: "Sucesso", description: "Categoria criada!" });
    },
    onError: (error: Error) => toast({ title: "Erro", description: error.message, variant: "destructive" }),
  });

  // ── Derived data ───────────────────────────────────────────────────────────
  const searchText = search.trim().toLowerCase();
  const outOfStockCount = products.filter(p => parseFloat(p.stock) <= 0).length;
  const lowStockCount = products.filter(p => {
    const s = parseFloat(p.stock), m = parseFloat(p.minStock);
    return s > 0 && s <= m;
  }).length;
  const recentlyEditedCount = products.filter(p => {
    const updated = new Date(p.updatedAt as any).getTime();
    return Number.isFinite(updated) && (Date.now() - updated) <= 24 * 60 * 60 * 1000;
  }).length;

  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';
  const inventoryFinancials = (() => {
    if (!isAdminOrManager) return null;
    let capitalInStock = 0, saleValueInStock = 0, marginSum = 0, marginCount = 0;
    for (const p of products as any[]) {
      const cost = parseFloat(p.costPrice ?? '0') || 0;
      const price = parseFloat(p.price ?? '0') || 0;
      const stock = parseFloat(p.stock ?? '0') || 0;
      capitalInStock += cost * stock;
      saleValueInStock += price * stock;
      if (cost > 0 && price > 0) { marginSum += ((price - cost) / price) * 100; marginCount++; }
    }
    return { capitalInStock, saleValueInStock, avgMargin: marginCount > 0 ? marginSum / marginCount : 0 };
  })();

  const filteredProducts = products
    .filter(p => !searchText ? true : p.name.toLowerCase().includes(searchText) || p.sku.toLowerCase().includes(searchText))
    .filter(p => {
      if (view === 'all') return true;
      const s = parseFloat(p.stock), m = parseFloat(p.minStock);
      if (view === 'out') return s <= 0;
      if (view === 'low') return s > 0 && s <= m;
      const updated = new Date(p.updatedAt as any).getTime();
      return Number.isFinite(updated) && (Date.now() - updated) <= 24 * 60 * 60 * 1000;
    });

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleExport = () => {
    const exportData = products.map(p => ({
      Nome: p.name, SKU: p.sku, Preço: parseFloat(p.price), Custo: parseFloat(p.costPrice),
      Estoque: parseFloat(p.stock), Minimo: parseFloat(p.minStock), Unidade: p.unit,
      Categoria: categories.find(c => c.id === p.categoryId)?.name || ''
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Produtos");
    XLSX.writeFile(wb, "produtos.xlsx");
    toast({ title: "Sucesso", description: "Produtos exportados com sucesso!" });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target?.result, { type: 'binary' });
      const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]) as any[];
      data.forEach((row: any) => {
        const categoryId = categories.find(c => c.name === row.Categoria)?.id || categories[0]?.id || null;
        createProductMutation.mutate({
          name: row.Nome || row.name || 'Produto Importado',
          sku: row.SKU || row.sku || `IMP-${Date.now()}`,
          price: String(row.Preço || row.price || 0),
          costPrice: String(row.Custo || row.costPrice || 0),
          stock: String(row.Estoque || row.stock || 0),
          minStock: String(row.Minimo || row.minStock || 5),
          unit: (row.Unidade || row.unit || 'un') as any,
          categoryId, image: ''
        });
      });
      toast({ title: "Sucesso", description: `Importando ${data.length} produtos...` });
    };
    reader.readAsBinaryString(file);
  };

  const handleSaveProduct = () => {
    if (!newProduct.name || !newProduct.price) {
      toast({ title: "Erro", description: "Nome e preço são obrigatórios", variant: "destructive" }); return;
    }
    if (editCount && !editCount.canEdit) {
      toast({ title: "Limite atingido", description: `Você atingiu o limite de ${editCount.limit} edições diárias`, variant: "destructive" }); return;
    }
    createProductMutation.mutate({
      name: newProduct.name,
      sku: newProduct.sku || newProduct.barcode || `SKU-${Date.now()}`,
      categoryId: newProduct.categoryId || categories[0]?.id || null,
      price: newProduct.price, costPrice: newProduct.costPrice || '0',
      stock: newProduct.stock || '0', minStock: newProduct.minStock || '5',
      unit: newProduct.unit, image: newProduct.image || ''
    });
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('Tem certeza que deseja deletar este produto?')) deleteProductMutation.mutate(id);
  };

  const handleEditProduct = (product: Product) => { setEditingProduct(product); setIsEditOpen(true); };

  const handleSaveEdit = () => {
    if (!editingProduct || !editingProduct.name || !editingProduct.price) {
      toast({ title: "Erro", description: "Nome e preço são obrigatórios", variant: "destructive" }); return;
    }
    if (editCount && !editCount.canEdit) {
      toast({ title: "Limite atingido", description: `Você atingiu o limite de ${editCount.limit} edições diárias`, variant: "destructive" }); return;
    }
    updateProductMutation.mutate({
      id: editingProduct.id,
      data: {
        name: editingProduct.name,
        sku: editingProduct.sku || (editingProduct as any).barcode || `SKU-${Date.now()}`,
        price: editingProduct.price, costPrice: editingProduct.costPrice,
        stock: editingProduct.stock, minStock: editingProduct.minStock,
        unit: editingProduct.unit, categoryId: editingProduct.categoryId,
        image: editingProduct.image
      }
    });
    setIsEditOpen(false);
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (productsLoading || categoriesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">Carregando produtos...</p>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".xlsx,.xls" title="Importar ficheiro Excel" aria-label="Importar ficheiro Excel" />

      <ProductsHeader
        totalProducts={products.length}
        outOfStockCount={outOfStockCount}
        lowStockCount={lowStockCount}
        recentlyEditedCount={recentlyEditedCount}
        editCount={editCount}
        inventoryFinancials={inventoryFinancials}
        onImportClick={() => fileInputRef.current?.click()}
        onExportClick={handleExport}
        addFormSlot={
          <ProductAddForm
            isAddOpen={isAddOpen}
            newProduct={newProduct}
            categories={categories}
            editCount={editCount}
            isCategoryDialogOpen={isCategoryDialogOpen}
            newCategory={newCategory}
            createProductMutationIsPending={createProductMutation.isPending}
            createCategoryMutationIsPending={createCategoryMutation.isPending}
            onAddOpenChange={setIsAddOpen}
            onNewProductChange={setNewProduct}
            onCategoryDialogOpenChange={setIsCategoryDialogOpen}
            onNewCategoryChange={setNewCategory}
            onSaveProduct={handleSaveProduct}
            onCreateCategory={() => createCategoryMutation.mutate(newCategory)}
            onBarcodeScanOpen={() => setBarcodeScanOpen('add')}
          />
        }
      />

      <ProductEditForm
        isEditOpen={isEditOpen}
        editingProduct={editingProduct}
        categories={categories}
        updateProductMutationIsPending={updateProductMutation.isPending}
        onEditOpenChange={setIsEditOpen}
        onEditingProductChange={setEditingProduct}
        onSaveEdit={handleSaveEdit}
        onBarcodeScanOpen={() => setBarcodeScanOpen('edit')}
      />

      <ProductsTable
        filteredProducts={filteredProducts}
        categories={categories}
        search={search}
        view={view}
        increaseStockOpen={increaseStockOpen}
        selectedProductId={selectedProductId}
        increaseQuantity={increaseQuantity}
        increasePrice={increasePrice}
        deleteProductMutationIsPending={deleteProductMutation.isPending}
        increaseStockMutationIsPending={increaseStockMutation.isPending}
        onSearchChange={setSearch}
        onViewChange={setView}
        onEditProduct={handleEditProduct}
        onDeleteProduct={handleDeleteProduct}
        onOpenIncreaseStock={(id) => { setSelectedProductId(id); setIncreaseStockOpen(true); }}
        onCloseIncreaseStock={() => { setIncreaseStockOpen(false); setSelectedProductId(''); }}
        onIncreaseQuantityChange={setIncreaseQuantity}
        onIncreasePriceChange={setIncreasePrice}
        onSaveIncreaseStock={(productId) => increaseStockMutation.mutate({
          id: productId,
          quantity: parseFloat(increaseQuantity),
          price: increasePrice ? parseFloat(increasePrice) : undefined
        })}
      />

      <Dialog open={!!barcodeScanOpen} onOpenChange={(o) => !o && setBarcodeScanOpen(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ler código de barras</DialogTitle>
          </DialogHeader>
          <BarcodeCameraScan
            id="products-barcode-scan"
            onScan={(code) => {
              if (barcodeScanOpen === 'add') {
                setNewProduct(p => ({ ...p, barcode: code, sku: p.sku || code }));
              } else if (barcodeScanOpen === 'edit' && editingProduct) {
                setEditingProduct({ ...editingProduct, barcode: code } as any);
              }
              setBarcodeScanOpen(null);
            }}
            onClose={() => setBarcodeScanOpen(null)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
