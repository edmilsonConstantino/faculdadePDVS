import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Package, Search, Store, Clock } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { formatCurrency } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Product, Category } from '@/lib/api';
import { loadInvoiceSettings } from '@/lib/invoiceSettings';
import { useAuth } from '@/lib/auth';
import {
  ProductBrowser,
  CartSheet,
  CheckoutForm,
  OrderTracking,
  WeighableQuantityDialog,
  useProductSearch,
} from '@/components/client-orders';
import type { CartItem, CheckoutFormData, OrderData, AuditData } from '@/components/client-orders';

export default function ClientOrders() {
  const { user } = useAuth();
  const [step, setStep] = useState<'intro' | 'browse' | 'checkout' | 'tracking'>('browse');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [consultOpen, setConsultOpen] = useState(false);
  const [trackingCode, setTrackingCode] = useState('');
  const [order, setOrder] = useState<OrderData | null>(null);
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditData, setAuditData] = useState<AuditData | null>(null);
  const [proofOpen, setProofOpen] = useState(false);
  const [formData, setFormData] = useState<CheckoutFormData>({
    customerName: '',
    customerPhone: '',
    paymentMethod: 'cash',
  });
  const [paymentProofDataUrl, setPaymentProofDataUrl] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState('0');
  const [productSearch, setProductSearch] = useState('');
  const [weighableModalOpen, setWeighableModalOpen] = useState(false);
  const [selectedWeighableProduct, setSelectedWeighableProduct] = useState<Product | null>(null);
  const [weighableQuantity, setWeighableQuantity] = useState(100);
  const [now, setNow] = useState(() => new Date());
  const [transferInfo] = useState(() => loadInvoiceSettings().transferAccounts);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const { data: productsData = [] } = useQuery({
    queryKey: ['/api/products'],
    queryFn: async () => {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('Erro ao buscar produtos');
      return res.json();
    },
  });

  const { data: categoriesData = [] } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Erro ao buscar categorias');
      return res.json();
    },
  });

  const products = productsData as Product[];
  const categories = categoriesData as Category[];

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      if (!formData.customerName || !formData.customerPhone || cart.length === 0) {
        throw new Error('Preencha todos os campos');
      }
      if (formData.paymentMethod === 'transfer' && !paymentProofDataUrl) {
        throw new Error('Anexe o comprovativo para transferência');
      }
      const total = cart.reduce((sum, item) => sum + item.priceAtSale * item.quantity, 0);
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          items: cart,
          total: total.toString(),
          paymentMethod: formData.paymentMethod,
          paymentProof: paymentProofDataUrl || undefined,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao criar pedido');
      }
      return res.json();
    },
    onSuccess: (data) => {
      setOrder(data);
      setStep('tracking');
      toast({ title: 'Sucesso!', description: `Pedido criado: ${data.orderCode}` });
      setCart([]);
      setPaymentProofDataUrl('');
    },
    onError: (error: any) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });

  const trackOrderMutation = useMutation({
    mutationFn: async () => {
      if (!trackingCode) throw new Error('Digite o código de rastreamento');
      const res = await fetch(`/api/orders/${trackingCode}`);
      if (!res.ok) throw new Error('Pedido não encontrado');
      return res.json();
    },
    onSuccess: (data) => {
      setOrder(data);
      setStep('tracking');
      toast({ title: 'Pedido encontrado!' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });

  const loadAuditMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await fetch(`/api/orders/${code}/audit`, { credentials: 'include' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Sem permissão ou auditoria indisponível');
      }
      return res.json();
    },
    onSuccess: (data) => {
      setAuditData(data);
      setAuditOpen(true);
    },
    onError: (error: any) => {
      toast({ title: 'Auditoria', description: error.message, variant: 'destructive' });
    },
  });

  const { filteredProducts, directMatches, fuzzySuggestions } = useProductSearch(
    products,
    selectedCategory,
    productSearch,
  );

  const total = cart.reduce((sum, item) => sum + item.priceAtSale * item.quantity, 0);

  const addToCart = (product: Product) => {
    const maxQty = parseFloat(product.stock);
    if (maxQty <= 0) {
      toast({ title: 'Indisponível', description: `${product.name} não tem estoque`, variant: 'destructive' });
      return;
    }
    if (product.unit === 'kg' || product.unit === 'g') {
      setSelectedWeighableProduct(product);
      setWeighableQuantity(Math.min(100, Math.max(100, maxQty * 1000)));
      setWeighableModalOpen(true);
      return;
    }
    const existing = cart.find((item) => item.productId === product.id);
    const totalQty = (existing?.quantity || 0) + 1;
    if (totalQty > maxQty) {
      toast({ title: 'Sem estoque', description: `Só temos ${Math.floor(maxQty)} unidades disponíveis.`, variant: 'destructive' });
      return;
    }
    if (existing) {
      existing.quantity += 1;
      setCart([...cart]);
    } else {
      setCart([...cart, { productId: product.id, product, quantity: 1, priceAtSale: parseFloat(product.price) }]);
    }
    toast({ title: 'Adicionado!', description: `${product.name} foi adicionado ao carrinho` });
  };

  const addWeighableToCart = () => {
    if (!selectedWeighableProduct) return;
    const maxStock = parseFloat(selectedWeighableProduct.stock) * 1000;
    if (weighableQuantity > maxStock) {
      toast({ title: 'Estoque insuficiente', description: `Máximo: ${(maxStock / 1000).toFixed(2)} kg`, variant: 'destructive' });
      return;
    }
    const pricePerGram = parseFloat(selectedWeighableProduct.price) / 1000;
    const totalPrice = pricePerGram * weighableQuantity;
    const existing = cart.find((item) => item.productId === selectedWeighableProduct.id);
    const totalQty = (existing?.quantity || 0) + weighableQuantity;
    if (totalQty > maxStock) {
      toast({ title: 'Estoque insuficiente', description: `Total: ${(maxStock / 1000).toFixed(2)} kg`, variant: 'destructive' });
      return;
    }
    if (existing) {
      existing.quantity += weighableQuantity;
      setCart([...cart]);
    } else {
      setCart([...cart, {
        productId: selectedWeighableProduct.id,
        product: selectedWeighableProduct,
        quantity: weighableQuantity,
        priceAtSale: totalPrice / weighableQuantity,
      }]);
    }
    toast({ title: 'Adicionado!', description: `${selectedWeighableProduct.name} foi adicionado ao carrinho` });
    setWeighableModalOpen(false);
    setSelectedWeighableProduct(null);
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    const item = cart.find((i) => i.productId === productId);
    if (item) {
      const p = item.product;
      const stock = p ? parseFloat(p.stock) : Infinity;
      if (p && (p.unit === 'kg' || p.unit === 'g')) {
        const maxGrams = Number.isFinite(stock) ? Math.floor(stock * 1000) : Infinity;
        const next = Math.max(100, quantity);
        if (next > maxGrams) {
          toast({ title: 'Estoque insuficiente', description: `Só temos ${(maxGrams / 1000).toFixed(2)} kg disponíveis.`, variant: 'destructive' });
          item.quantity = Math.max(100, maxGrams);
        } else {
          item.quantity = next;
        }
      } else {
        const maxUnits = Number.isFinite(stock) ? Math.floor(stock) : Infinity;
        const next = Math.max(1, quantity);
        if (next > maxUnits) {
          toast({ title: 'Estoque insuficiente', description: `Só temos ${maxUnits} unidades disponíveis.`, variant: 'destructive' });
          item.quantity = Math.max(1, maxUnits);
        } else {
          item.quantity = next;
        }
      }
      setCart([...cart]);
    }
  };

  const formatQuantityDisplay = (item: CartItem) => {
    if (item.product && (item.product.unit === 'kg' || item.product.unit === 'g')) {
      const kg = item.quantity / 1000;
      return kg >= 1 ? `${kg.toFixed(2)} kg` : `${item.quantity} g`;
    }
    return `${item.quantity}x`;
  };

  const canSeeAudit = !!(user && user.role !== 'seller');

  return (
    <>
      <WeighableQuantityDialog
        open={weighableModalOpen}
        onOpenChange={setWeighableModalOpen}
        selectedWeighableProduct={selectedWeighableProduct}
        weighableQuantity={weighableQuantity}
        setWeighableQuantity={setWeighableQuantity}
        onConfirm={addWeighableToCart}
      />

      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-6xl space-y-5 px-4 pb-24 pt-5 sm:px-6 md:pb-10">

          {/* Header / Hero */}
          <div className="overflow-hidden rounded-3xl shadow-sm">
            <div className="relative bg-gradient-to-br from-[#c0392b] via-[#a93226] to-[#922b21] px-5 py-5 sm:px-7 sm:py-6">
              <div className="banner-texture" />
              <div className="relative flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
                    <Store className="h-5 w-5 text-white" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">Makira Sales</h1>
                    <p className="mt-0.5 text-[11px] font-medium text-white/60">
                      Faça o seu pedido · {now.toLocaleString('pt-PT', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="hidden items-center gap-2 sm:flex">
                  <Button type="button" variant="outline" className="rounded-xl border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white" onClick={() => setStep('browse')}>
                    Produtos
                  </Button>
                  <Button type="button" className="rounded-xl bg-white font-bold text-[#B71C1C] hover:bg-gray-100 shadow-lg shadow-black/20" onClick={() => setConsultOpen(true)}>
                    Consultar pedido
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Consultar pedido sheet */}
          <Sheet open={consultOpen} onOpenChange={setConsultOpen}>
            <SheetContent side="bottom" className="max-h-[92dvh] overflow-y-auto rounded-t-[2rem] border-0 border-t border-border/70 bg-white p-0 shadow-[0_-24px_70px_-28px_rgba(99,102,241,0.35)]">
              <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-muted-foreground/25" aria-hidden />
              <div className="px-5 pb-6 pt-4">
                <SheetHeader className="space-y-1 text-left">
                  <SheetTitle className="font-heading text-2xl font-black">Consultar pedido</SheetTitle>
                  <SheetDescription className="text-sm font-medium">Digite o código e veja o status.</SheetDescription>
                </SheetHeader>
                <div className="mt-5 space-y-3">
                  <Input
                    placeholder="Ex: ABC12345"
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                    maxLength={8}
                    className="h-12 rounded-2xl"
                  />
                  <Button type="button" onClick={() => trackOrderMutation.mutate()} disabled={trackOrderMutation.isPending} className="h-12 w-full rounded-2xl bg-[#B71C1C] hover:bg-[#9b1414] font-black">
                    {trackOrderMutation.isPending ? 'Consultando…' : 'Consultar'}
                  </Button>
                  <p className="text-xs text-muted-foreground">Dica: o código vem quando você finaliza um pedido.</p>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Mobile bottom navbar */}
          <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-6xl px-4 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] md:hidden">
            <div className="pointer-events-auto mx-auto flex max-w-lg items-center justify-between gap-2 rounded-3xl border border-gray-200 bg-white px-3 py-2 shadow-lg">
              <button type="button" onClick={() => setStep('browse')} className={`flex flex-1 items-center justify-center gap-2 rounded-2xl px-3 py-2 text-xs font-bold transition ${step === 'browse' ? 'bg-[#B71C1C] text-white' : 'text-gray-500'}`}>
                <Package className="h-4 w-4" /> Produtos
              </button>
              <button type="button" onClick={() => setCartOpen(true)} className="relative flex flex-1 items-center justify-center gap-2 rounded-2xl px-3 py-2 text-xs font-bold text-gray-500 transition hover:text-gray-900">
                <ShoppingCart className="h-4 w-4" /> Carrinho
                {cart.length > 0 && (
                  <span className="absolute right-2 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#B71C1C] text-[9px] font-black text-white">{cart.length}</span>
                )}
              </button>
              <button type="button" onClick={() => setConsultOpen(true)} className={`flex flex-1 items-center justify-center gap-2 rounded-2xl px-3 py-2 text-xs font-bold transition ${consultOpen ? 'bg-[#B71C1C] text-white' : 'text-gray-500'}`}>
                <Search className="h-4 w-4" /> Consultar
              </button>
            </div>
          </div>

          {/* Mobile floating cart bar */}
          {cart.length > 0 && step === 'browse' && (
            <div className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-6xl justify-center px-4 pb-[calc(max(0.75rem,env(safe-area-inset-bottom,0px))+3.75rem)] md:hidden" aria-live="polite">
              <button type="button" onClick={() => setCartOpen(true)} className="w-full max-w-lg rounded-3xl border border-gray-200 bg-white px-4 py-3 shadow-xl transition active:scale-[0.99]">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#B71C1C] text-white font-black text-sm">{cart.length}</span>
                    <div className="text-left">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Carrinho</p>
                      <p className="text-sm font-black text-gray-900">{formatCurrency(total)}</p>
                    </div>
                  </div>
                  <span className="rounded-2xl bg-[#B71C1C] px-4 py-2 text-sm font-bold text-white">Ver carrinho</span>
                </div>
              </button>
            </div>
          )}

          {/* Cart mobile sheet */}
          <CartSheet
            open={cartOpen}
            onOpenChange={setCartOpen}
            cart={cart}
            total={total}
            onRemoveFromCart={removeFromCart}
            onUpdateQuantity={updateQuantity}
            onGoToCheckout={() => setStep('checkout')}
            formatQuantityDisplay={formatQuantityDisplay}
          />

          {step === 'intro' && (
            <div className="space-y-4">
              <Card className="border-gray-200 bg-white">
                <CardContent className="pt-6 space-y-4">
                  <div className="grid gap-2 text-sm text-muted-foreground">
                    <p><strong className="text-foreground">1.</strong> Procure e adicione ao carrinho.</p>
                    <p><strong className="text-foreground">2.</strong> Finalize e receba um código.</p>
                    <p><strong className="text-foreground">3.</strong> Rastreie pelo código quando quiser.</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => setStep('browse')} className="flex-1 rounded-2xl bg-[#B71C1C] hover:bg-[#9b1414]">Ver produtos</Button>
                    <Button onClick={() => setStep('tracking')} variant="outline" className="flex-1 rounded-2xl">Rastrear</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {step === 'browse' && (
            <ProductBrowser
              filteredProducts={filteredProducts}
              directMatches={directMatches}
              fuzzySuggestions={fuzzySuggestions}
              categories={categories}
              cart={cart}
              total={total}
              productSearch={productSearch}
              selectedCategory={selectedCategory}
              onProductSearchChange={setProductSearch}
              onCategoryChange={setSelectedCategory}
              onAddToCart={addToCart}
              onRemoveFromCart={removeFromCart}
              onUpdateQuantity={updateQuantity}
              onGoToCheckout={() => setStep('checkout')}
              formatQuantityDisplay={formatQuantityDisplay}
            />
          )}

          <CheckoutForm
            isMobile={isMobile}
            checkoutOpen={step === 'checkout'}
            formData={formData}
            paymentProofDataUrl={paymentProofDataUrl}
            cart={cart}
            total={total}
            isSubmitting={createOrderMutation.isPending}
            transferInfo={transferInfo}
            onFormDataChange={setFormData}
            onPaymentProofChange={setPaymentProofDataUrl}
            onConfirm={() => createOrderMutation.mutate()}
            onBack={() => setStep('browse')}
          />

          {step === 'tracking' && order && (
            <OrderTracking
              order={order}
              auditOpen={auditOpen}
              auditData={auditData}
              proofOpen={proofOpen}
              isLoadingAudit={loadAuditMutation.isPending}
              canSeeAudit={canSeeAudit}
              onAuditOpenChange={setAuditOpen}
              onProofOpenChange={setProofOpen}
              onLoadAudit={() => order.orderCode && loadAuditMutation.mutate(order.orderCode)}
              onNewOrder={() => { setStep('browse'); setOrder(null); }}
            />
          )}

          {step !== 'tracking' && (
            <Card className="border-gray-200 bg-gray-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-[#B71C1C]" />
                  <div className="text-sm">
                    <p className="font-semibold text-gray-900">Já tem um código de rastreamento?</p>
                    <p className="text-muted-foreground">Clique abaixo para acompanhar seu pedido</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Input
                    placeholder="Digite seu código (ex: ABC12345)"
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                    className="border-gray-200"
                    maxLength={8}
                  />
                  <Button onClick={() => trackOrderMutation.mutate()} disabled={trackOrderMutation.isPending} className="bg-[#B71C1C] hover:bg-[#9b1414]">
                    Rastrear
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </>
  );
}
