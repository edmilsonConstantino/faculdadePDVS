import { useAuth } from '@/lib/auth';
import { useCart } from '@/lib/cart';
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Product, productsApi, categoriesApi, salesApi, scannerApi, ScannerSessionInfo } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { useMediaQuery } from '@/hooks/use-media-query';
import { InvoicePreviewDialog } from '@/components/invoice/InvoicePreviewDialog';
import type { InvoiceData } from '@/lib/invoiceModels';
import { loadInvoiceSettings } from '@/lib/invoiceSettings';
import {
  loadPosPrefs,
  savePosPrefs,
  loadRecentProductIds,
  recordRecentProduct,
  migratePosPrefsIfNeeded,
  type PosPrefs,
} from '@/lib/posLocalStorage';

import { ProductSelector } from '@/components/pos/ProductSelector';
import { CartSummary } from '@/components/pos/CartSummary';
import { PaymentFlow, type PaymentMethod } from '@/components/pos/PaymentFlow';
import { CameraScanDialog, RemoteScannerDialog, RemoteScannerPoller } from '@/components/pos/ScannerInterface';

/** Pesquisa imediata + tolerância a acentos */
function normalizeForSearch(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

function formatStockRemaining(unit: string, n: number): string {
  if (unit === 'kg') return n.toFixed(3);
  if (unit === 'g') return String(Math.round(n));
  return String(Math.max(0, Math.round(n)));
}

export default function POS() {
  const { user } = useAuth();
  const { cart, addToCart, removeFromCart, updateCartQuantity, clearCart } = useCart();
  const queryClient = useQueryClient();

  const { data: products = [], isLoading: productsLoading, isFetching: productsFetching } = useQuery({
    queryKey: ['/api/products'],
    queryFn: productsApi.getAll,
    placeholderData: (prev) => prev,
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: categoriesApi.getAll,
    placeholderData: (prev) => prev,
  });

  const createSaleMutation = useMutation({
    mutationFn: salesApi.create,
    onSuccess: (sale) => {
      const cfg = loadInvoiceSettings();
      const preview = (sale as any)?.preview;
      const previewItems = (preview?.items ?? []) as Array<any>;

      const lines = previewItems.map((it) => {
        const qty = Number(it.quantity ?? 0);
        const unitPrice = Number(it.priceAtSale ?? 0);
        return {
          name: it.productName || it.productId,
          qty,
          unit: it.productUnit,
          unitPrice,
          total: qty * unitPrice,
        };
      });

      const invoiceNo = `MK-${new Date().getFullYear()}-${String(sale.id ?? '').slice(0, 6).toUpperCase()}`;
      const issuedAt = new Date((sale as any)?.createdAt ?? Date.now());

      const invoice: InvoiceData = {
        invoiceNo,
        issuedAt,
        currencyLabel: cfg.currencyLabel,
        seller: cfg.seller,
        customer: { name: 'Consumidor final' },
        paymentMethod: preview?.paymentMethod ?? (sale as any)?.paymentMethod,
        lines,
        subtotal: Number(preview?.subtotal ?? preview?.total ?? sale.total),
        discount: Number(preview?.discountAmount ?? 0) || undefined,
        total: Number(preview?.total ?? sale.total),
        notes: cfg.defaultNotes,
        qrValue: cfg.showQr ? invoiceNo : undefined,
        barcodeValue: cfg.showBarcode ? invoiceNo : undefined,
      };

      clearCart();
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sales'] });
      toast({ title: 'Sucesso', description: 'Venda registrada com sucesso!' });
      setCartSheetOpen(false);
      setPaymentOpen(false);
      setActiveDiscount({ type: 'none', value: 0 });
      setAmountReceived(0);
      setInvoiceData(invoice);
      setInvoiceOpen(true);
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });

  /* ------------------------------------------------------------------ */
  /* State                                                                */
  /* ------------------------------------------------------------------ */

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
  const [recentProductIds, setRecentProductIds] = useState<string[]>(() => loadRecentProductIds());
  const [stockPreview, setStockPreview] = useState<{ productId: string; remaining: number; unit: string } | null>(null);
  const stockPreviewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [cartSheetOpen, setCartSheetOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [weightOpen, setWeightOpen] = useState(false);
  const [selectedWeightProduct, setSelectedWeightProduct] = useState<Product | null>(null);
  const [weightInGrams, setWeightInGrams] = useState(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [showPreviewConfirm, setShowPreviewConfirm] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);

  const [discountValue, setDiscountValue] = useState(0);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [activeDiscount, setActiveDiscount] = useState({ type: 'none', value: 0 });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => loadPosPrefs().viewMode);

  const [cameraScanOpen, setCameraScanOpen] = useState(false);
  const [remoteScannerOpen, setRemoteScannerOpen] = useState(false);
  const [scannerToken, setScannerToken] = useState<string | null>(null);
  const [scannerUrl, setScannerUrl] = useState<string>('');
  const [, setScannerSessions] = useState<ScannerSessionInfo[]>([]);

  const [amountReceived, setAmountReceived] = useState(0);

  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const isMobileViewport = useMediaQuery('(max-width: 767px)');

  const canApplyDiscount = user?.role === 'admin' || user?.role === 'manager';

  /* ------------------------------------------------------------------ */
  /* Effects                                                              */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    if (!isMobileViewport) return;
    setRemoteScannerOpen(false);
    setScannerToken((current) => {
      if (current) scannerApi.revoke(current).catch(() => {});
      return null;
    });
    setScannerUrl('');
    setScannerSessions([]);
  }, [isMobileViewport]);

  useEffect(() => { migratePosPrefsIfNeeded(); }, []);

  useEffect(() => {
    const prefs: PosPrefs = { viewMode };
    savePosPrefs(prefs);
  }, [viewMode]);

  useEffect(() => {
    return () => {
      if (stockPreviewTimerRef.current) clearTimeout(stockPreviewTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isMobileViewport) return;
    const openCart = () => setCartSheetOpen(true);
    window.addEventListener('makira:pos-open-cart', openCart);
    return () => window.removeEventListener('makira:pos-open-cart', openCart);
  }, [isMobileViewport]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const inField = el.closest('input, textarea, select, [contenteditable=true]');
      if (inField && el !== barcodeInputRef.current) return;
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        barcodeInputRef.current?.focus();
        barcodeInputRef.current?.select();
      }
      if (e.key === 'Escape' && document.activeElement === barcodeInputRef.current) {
        setSearch('');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* ------------------------------------------------------------------ */
  /* Derived / memoised                                                   */
  /* ------------------------------------------------------------------ */

  const skuLookup = useMemo(() => {
    const m = new Map<string, Product>();
    for (const p of products) m.set(p.sku.toLowerCase(), p);
    return m;
  }, [products]);

  const filteredProducts = useMemo(() => {
    const norm = normalizeForSearch(search);
    const tokens = norm.split(/\s+/).filter(Boolean);
    return products.filter((p) => {
      const nameN = normalizeForSearch(p.name);
      const skuN = normalizeForSearch(p.sku);
      const matchesSearch = tokens.length === 0 || tokens.every((t) => nameN.includes(t) || skuN.includes(t));
      const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategory]);

  const recentProducts = useMemo(() => {
    const map = new Map(products.map((p) => [p.id, p]));
    return recentProductIds.map((id) => map.get(id)).filter((p): p is Product => Boolean(p));
  }, [products, recentProductIds]);

  const subtotal = cart.reduce((acc, item) => acc + item.priceAtSale * item.quantity, 0);

  let discountAmount = 0;
  if (activeDiscount.type === 'percentage') {
    discountAmount = subtotal * (activeDiscount.value / 100);
  } else if (activeDiscount.type === 'fixed') {
    discountAmount = activeDiscount.value;
  }

  const cartTotal = Math.max(0, subtotal - discountAmount);
  const change = Math.max(0, amountReceived - cartTotal);

  /* ------------------------------------------------------------------ */
  /* Handlers                                                             */
  /* ------------------------------------------------------------------ */

  const bumpRecent = useCallback((productId: string) => {
    recordRecentProduct(productId);
    setRecentProductIds(loadRecentProductIds());
  }, []);

  const flashStockPreview = useCallback((product: Product, qtyInCartAfter: number) => {
    const st = parseFloat(product.stock);
    const remaining = Math.max(0, Number((st - qtyInCartAfter).toFixed(4)));
    setStockPreview({ productId: product.id, remaining, unit: product.unit });
    if (stockPreviewTimerRef.current) clearTimeout(stockPreviewTimerRef.current);
    stockPreviewTimerRef.current = setTimeout(() => setStockPreview(null), 4200);
  }, []);

  const processBarcode = (barcode: string) => {
    const code = barcode.trim();
    if (!code) return;
    const product = skuLookup.get(code.toLowerCase()) ?? products.find((p) => p.sku === code);
    if (product) {
      handleAddProduct(product);
      setSearch('');
    } else {
      toast({ variant: 'destructive', title: 'Item não encontrado', description: `Código ${code} não existe no cadastro.` });
    }
  };

  const handleAddProduct = (product: Product) => {
    if (product.unit === 'kg') {
      setSelectedWeightProduct(product);
      setWeightInGrams(0);
      setWeightOpen(true);
    } else {
      try {
        const prevQty = cart.find((i) => i.productId === product.id)?.quantity ?? 0;
        addToCart(product, 1);
        bumpRecent(product.id);
        const after = prevQty + 1;
        const left = Math.max(0, parseFloat(product.stock) - after);
        flashStockPreview(product, after);
        toast({
          title: 'Adicionado',
          description: `Ficam ${formatStockRemaining(product.unit, left)} ${product.unit} no armazém após concluir a venda.`,
        });
      } catch (error: any) {
        toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      }
    }
  };

  const confirmWeightAdd = () => {
    if (selectedWeightProduct && weightInGrams > 0) {
      const quantityInKg = weightInGrams / 1000;
      try {
        const prevQty = cart.find((i) => i.productId === selectedWeightProduct.id)?.quantity ?? 0;
        addToCart(selectedWeightProduct, quantityInKg);
        bumpRecent(selectedWeightProduct.id);
        const after = prevQty + quantityInKg;
        const left = Math.max(0, parseFloat(selectedWeightProduct.stock) - after);
        flashStockPreview(selectedWeightProduct, after);
        toast({
          title: 'Adicionado',
          description: `${weightInGrams} g · ficam ${formatStockRemaining('kg', left)} kg no armazém após a venda.`,
        });
        setWeightOpen(false);
        setSelectedWeightProduct(null);
        setWeightInGrams(0);
      } catch (error: any) {
        toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      }
    }
  };

  const handleQuantityChange = (productId: string, delta: number) => {
    const item = cart.find((i) => i.productId === productId);
    if (!item) return;
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    let step = 1;
    if (product.unit === 'kg') step = 0.1;

    const newQuantity = Math.max(0, Number((item.quantity + delta * step).toFixed(3)));
    const parsedStock = parseFloat(product.stock);

    if (newQuantity <= 0) { removeFromCart(productId); return; }

    if (newQuantity > parsedStock + 1e-9) {
      toast({
        variant: 'destructive',
        title: 'Stock insuficiente',
        description: `Máximo ${parsedStock} ${product.unit} disponível.`,
      });
      return;
    }

    updateCartQuantity(productId, newQuantity, parsedStock);
    if (delta > 0) flashStockPreview(product, newQuantity);
  };

  const handleApplyDiscount = () => {
    setActiveDiscount({ type: discountType, value: discountValue });
    setDiscountOpen(false);
  };

  const openCheckout = useCallback(() => {
    setAmountReceived(0);
    setCartSheetOpen(false);
    setPaymentOpen(true);
  }, []);

  const handleCheckout = (method: PaymentMethod) => {
    if (cart.length === 0 || !user) return;
    if (method === 'cash' && amountReceived < cartTotal) {
      toast({ title: 'Erro', description: 'Valor insuficiente para completar a venda', variant: 'destructive' });
      return;
    }
    setSelectedPaymentMethod(method);
    setShowPreviewConfirm(true);
  };

  const handleConfirmPreview = () => {
    setShowPreviewConfirm(false);
    confirmSale();
  };

  const confirmSale = () => {
    if (cart.length === 0 || !user || !selectedPaymentMethod) return;

    for (const item of cart) {
      const p = products.find((x) => x.id === item.productId);
      if (!p) continue;
      const st = parseFloat(p.stock);
      if (item.quantity > st + 1e-9) {
        toast({
          variant: 'destructive',
          title: 'Stock desactualizado',
          description: `${p.name}: pedido ${item.quantity} ${p.unit}, disponível ${st}. Actualize a lista e ajuste o carrinho.`,
        });
        return;
      }
    }

    createSaleMutation.mutate({
      userId: user.id,
      total: cartTotal.toString(),
      amountReceived: amountReceived > 0 ? amountReceived.toString() : undefined,
      change: change > 0 ? change.toString() : undefined,
      paymentMethod: selectedPaymentMethod,
      items: cart.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        priceAtSale: item.priceAtSale,
      })),
      preview: {
        items: cart.map((item) => {
          const product = products.find((p) => p.id === item.productId);
          return {
            productId: item.productId,
            quantity: item.quantity,
            priceAtSale: item.priceAtSale,
            productName: product?.name || '',
            productUnit: product?.unit || '',
          };
        }),
        subtotal,
        discount: activeDiscount,
        discountAmount,
        total: cartTotal,
        paymentMethod: selectedPaymentMethod,
        amountReceived: amountReceived > 0 ? amountReceived : undefined,
        change: change > 0 ? change : undefined,
      },
    });
    setSelectedPaymentMethod(null);
  };

  /* ------------------------------------------------------------------ */
  /* Loading state                                                        */
  /* ------------------------------------------------------------------ */

  if (productsLoading || categoriesLoading) {
    return (
      <div className="flex min-h-[50vh] flex-1 items-center justify-center py-16">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-2xl border-2 border-primary border-t-transparent" />
          <p className="text-sm font-semibold text-muted-foreground">A carregar produtos…</p>
        </div>
      </div>
    );
  }

  const mobileFloatingCartPad =
    isMobileViewport && cart.length > 0 && !cartSheetOpen
      ? 'pb-[calc(6.75rem+env(safe-area-inset-bottom,0px))]'
      : '';

  /* ------------------------------------------------------------------ */
  /* Render                                                               */
  /* ------------------------------------------------------------------ */

  return (
    <div
      className={cn(
        'flex min-h-0 flex-1 flex-col gap-3 p-2 pb-2 lg:max-h-[calc(100dvh-5.5rem)] lg:flex-row lg:gap-5 lg:p-1',
        mobileFloatingCartPad,
      )}
    >
      <InvoicePreviewDialog open={invoiceOpen} onOpenChange={setInvoiceOpen} data={invoiceData} />

      {/* MOBILE: modo venda / carrinho — segmento com animação */}
      <div className="shrink-0 lg:hidden">
        <div className="relative mb-3 flex h-[3.25rem] rounded-[1.35rem] border border-border/80 bg-muted/40 p-1 shadow-inner">
          <motion.div
            className="pointer-events-none absolute inset-y-1 rounded-[1.05rem] bg-gradient-to-r from-[#C0392B] to-[#7F1D1D] shadow-md shadow-[#B71C1C]/20"
            style={{ width: 'calc(50% - 0.375rem)' }}
            initial={false}
            animate={{ left: cartSheetOpen ? 'calc(50% + 0.125rem)' : '0.25rem' }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
          />
          <button
            type="button"
            className={cn(
              'relative z-10 flex flex-1 items-center justify-center gap-2 rounded-[1.05rem] text-sm font-bold transition-colors',
              cartSheetOpen ? 'text-muted-foreground' : 'text-primary-foreground',
            )}
            onClick={() => setCartSheetOpen(false)}
            data-testid="button-tab-produtos"
          >
            <ShoppingBag className="h-4 w-4" />
            Vender
          </button>
          <button
            type="button"
            className={cn(
              'relative z-10 flex flex-1 items-center justify-center gap-2 rounded-[1.05rem] text-sm font-bold transition-colors',
              cartSheetOpen ? 'text-primary-foreground' : 'text-muted-foreground',
            )}
            onClick={() => setCartSheetOpen(true)}
            data-testid="button-tab-carrinho"
          >
            <ShoppingCart className="h-4 w-4" />
            Carrinho
            {cart.length > 0 && (
              <motion.span
                layout
                className={cn(
                  'flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-black tabular-nums',
                  cartSheetOpen ? 'bg-white/25' : 'bg-primary/15 text-primary',
                )}
              >
                {cart.length}
              </motion.span>
            )}
          </button>
        </div>
      </div>

      {/* Product selector */}
      <ProductSelector
        products={products}
        filteredProducts={filteredProducts}
        categories={categories}
        cart={cart}
        search={search}
        selectedCategory={selectedCategory}
        viewMode={viewMode}
        stockPreview={stockPreview}
        recentProducts={recentProducts}
        isMobileViewport={isMobileViewport}
        productsFetching={productsFetching}
        productsLoading={productsLoading}
        cartSheetOpen={cartSheetOpen}
        scannerToken={scannerToken}
        onSearchChange={setSearch}
        onCategoryChange={setSelectedCategory}
        onViewModeChange={setViewMode}
        onAddProduct={handleAddProduct}
        onQuantityChange={handleQuantityChange}
        onCameraScanOpen={() => setCameraScanOpen(true)}
        onRemoteScannerOpen={() => setRemoteScannerOpen(true)}
        onScannerTokenChange={(token, url) => {
          setScannerToken(token);
          setScannerUrl(url);
          scannerApi.sessions().then(setScannerSessions).catch(() => setScannerSessions([]));
        }}
        barcodeInputRef={barcodeInputRef}
      />

      {/* CartSummary handles both the floating bar, the mobile sheet, and the desktop panel */}
      <CartSummary
        cart={cart}
        products={products}
        subtotal={subtotal}
        discountAmount={discountAmount}
        cartTotal={cartTotal}
        activeDiscount={activeDiscount}
        discountOpen={discountOpen}
        discountType={discountType}
        discountValue={discountValue}
        canApplyDiscount={canApplyDiscount}
        cartSheetOpen={cartSheetOpen}
        isMobileViewport={isMobileViewport}
        onCartSheetOpenChange={setCartSheetOpen}
        onQuantityChange={handleQuantityChange}
        onRemoveFromCart={removeFromCart}
        onUpdateCartQuantity={updateCartQuantity}
        onFlashStockPreview={flashStockPreview}
        onClearCart={clearCart}
        onOpenCheckout={openCheckout}
        onDiscountOpenChange={setDiscountOpen}
        onDiscountTypeChange={setDiscountType}
        onDiscountValueChange={setDiscountValue}
        onApplyDiscount={handleApplyDiscount}
      />

      {/* Payment dialogs */}
      <PaymentFlow
        weightOpen={weightOpen}
        selectedWeightProduct={selectedWeightProduct}
        weightInGrams={weightInGrams}
        onWeightOpenChange={setWeightOpen}
        onWeightInGramsChange={setWeightInGrams}
        onConfirmWeightAdd={confirmWeightAdd}
        showPreviewConfirm={showPreviewConfirm}
        selectedPaymentMethod={selectedPaymentMethod}
        cart={cart}
        products={products}
        subtotal={subtotal}
        discountAmount={discountAmount}
        cartTotal={cartTotal}
        activeDiscount={activeDiscount}
        amountReceived={amountReceived}
        change={change}
        onShowPreviewConfirmChange={setShowPreviewConfirm}
        onConfirmPreview={handleConfirmPreview}
        paymentOpen={paymentOpen}
        onPaymentOpenChange={setPaymentOpen}
        onAmountReceivedChange={setAmountReceived}
        onRemoveFromCart={removeFromCart}
        onCheckout={handleCheckout}
      />

      {/* Scanner interface */}
      {scannerToken && (
        <RemoteScannerPoller
          token={scannerToken}
          onBarcode={processBarcode}
          onClose={() => {
            setRemoteScannerOpen(false);
            setScannerToken(null);
          }}
        />
      )}

      <RemoteScannerDialog
        open={remoteScannerOpen}
        onOpenChange={setRemoteScannerOpen}
        token={scannerToken}
        url={scannerUrl}
        onTokenChange={(t, u) => { setScannerToken(t); setScannerUrl(u || ''); }}
        onSessionsChange={setScannerSessions}
      />

      <CameraScanDialog
        open={cameraScanOpen}
        onOpenChange={setCameraScanOpen}
        onScan={processBarcode}
      />
    </div>
  );
}
