import { useAuth } from '@/lib/auth';
import { Tabs, TabsList } from '@/components/ui/tabs';
import { Shield, Users, History, Receipt, RotateCcw, Plus, Edit, ShoppingCart, Package, Trash2, Activity } from 'lucide-react';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, auditLogsApi, salesApi, productsApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { loadInvoiceSettings, saveInvoiceSettings, type InvoiceSettings } from '@/lib/invoiceSettings';
import { useLocation } from 'wouter';
import type { InvoiceData } from '@/lib/invoiceModels';
import { UsersTab } from '@/components/settings/UsersTab';
import { AuditTab } from '@/components/settings/AuditTab';
import { InvoiceSettingsTab } from '@/components/settings/InvoiceSettingsTab';
import { RollbackTab } from '@/components/settings/RollbackTab';

export default function SettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("users");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState('');
  const [orderAuditCode, setOrderAuditCode] = useState('');
  const [orderAuditData, setOrderAuditData] = useState<any>(null);
  const [orderAuditOpen, setOrderAuditOpen] = useState(false);

  // Rollback state
  const [rollbackPreview, setRollbackPreview] = useState<any>(null);
  const [rollbackConfirmText, setRollbackConfirmText] = useState('');
  const [rollbackModalOpen, setRollbackModalOpen] = useState(false);
  const [rollbackTarget, setRollbackTarget] = useState<{ type: 'snapshot'; id: string; label: string } | { type: 'audit'; date: string } | null>(null);
  const [auditRollbackDate, setAuditRollbackDate] = useState('');
  const [auditRollbackPreview, setAuditRollbackPreview] = useState<any>(null);
  const [auditRollbackLoading, setAuditRollbackLoading] = useState(false);
  const [manualSnapshotLabel, setManualSnapshotLabel] = useState('');

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users'],
    queryFn: usersApi.getAll,
    enabled: user?.role === 'admin' || user?.role === 'manager',
  });

  const { data: auditLogs = [], isLoading: auditLogsLoading } = useQuery({
    queryKey: ['/api/audit-logs'],
    queryFn: auditLogsApi.getAll
  });

  const orderAuditMutation = useMutation({
    mutationFn: async (code: string) => {
      const c = code.trim().toUpperCase();
      if (!c) throw new Error('Informe o código do pedido');
      const res = await fetch(`/api/orders/${c}/audit`, { credentials: 'include' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Sem permissão ou pedido não encontrado');
      }
      return res.json();
    },
    onSuccess: (data) => {
      setOrderAuditData(data);
      setOrderAuditOpen(true);
    },
    onError: (error: any) => {
      toast({ title: 'Auditoria do pedido', description: error.message, variant: 'destructive' });
    }
  });

  const { isLoading: salesLoading } = useQuery({
    queryKey: ['/api/sales'],
    queryFn: salesApi.getAll
  });

  const { data: snapshots = [], refetch: refetchSnapshots } = useQuery<any[]>({
    queryKey: ['/api/snapshots'],
    queryFn: async () => {
      const res = await fetch('/api/snapshots', { credentials: 'include' });
      if (!res.ok) throw new Error('Erro ao carregar snapshots');
      return res.json();
    },
    enabled: activeTab === 'rollback' && (user?.role === 'admin' || user?.role === 'manager'),
  });

  const createSnapshotMutation = useMutation({
    mutationFn: async (label: string) => {
      const res = await fetch('/api/snapshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ label }),
      });
      if (!res.ok) throw new Error('Erro ao criar snapshot');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Snapshot criado', description: 'Estado actual guardado com sucesso.' });
      setManualSnapshotLabel('');
      refetchSnapshots();
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const restoreSnapshotMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/snapshots/${id}/restore`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Erro ao restaurar snapshot');
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: '✅ Restaurado!', description: `${data.restoredProducts} produto(s) e ${data.restoredCategories} categoria(s) restaurados.` });
      setRollbackModalOpen(false);
      setRollbackConfirmText('');
      setRollbackPreview(null);
      setRollbackTarget(null);
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const applyAuditRollbackMutation = useMutation({
    mutationFn: async (targetDate: string) => {
      const res = await fetch('/api/snapshots/audit-rollback/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ targetDate }),
      });
      if (!res.ok) throw new Error('Erro ao aplicar reversão');
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: '✅ Revertido!', description: `${data.productsReverted} produto(s) revertidos para o estado de ${auditRollbackDate}.` });
      setRollbackModalOpen(false);
      setRollbackConfirmText('');
      setAuditRollbackPreview(null);
      setRollbackTarget(null);
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  async function loadSnapshotPreview(snap: any) {
    try {
      const res = await fetch(`/api/snapshots/${snap.id}/preview`, { credentials: 'include' });
      const data = await res.json();
      setRollbackPreview(data);
      setRollbackTarget({ type: 'snapshot', id: snap.id, label: snap.label });
      setRollbackConfirmText('');
      setRollbackModalOpen(true);
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível carregar preview', variant: 'destructive' });
    }
  }

  async function loadAuditRollbackPreview(date: string) {
    if (!date) return;
    setAuditRollbackLoading(true);
    try {
      const res = await fetch(`/api/snapshots/audit-rollback/preview?date=${date}`, { credentials: 'include' });
      const data = await res.json();
      setAuditRollbackPreview(data);
      setRollbackTarget({ type: 'audit', date });
      setRollbackConfirmText('');
      setRollbackModalOpen(true);
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível carregar preview', variant: 'destructive' });
    } finally {
      setAuditRollbackLoading(false);
    }
  }

  const { isLoading: productsLoading } = useQuery({
    queryKey: ['/api/products'],
    queryFn: productsApi.getAll
  });

  const [newUser, setNewUser] = useState({
    username: '',
    name: '',
    password: '',
    role: 'seller' as 'admin' | 'manager' | 'seller'
  });

  const [editingUser, setEditingUser] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [userFilter, setUserFilter] = useState('');

  const createUserMutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsAddUserOpen(false);
      setNewUser({ username: '', name: '', password: '', role: 'seller' });
      toast({ title: "Sucesso", description: "Usuário criado com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Erro", 
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => usersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsEditOpen(false);
      setEditingUser(null);
      toast({ title: "Sucesso", description: "Usuário atualizado com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Erro", 
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: usersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setDeletingUserId(null);
      toast({ title: "Sucesso", description: "Usuário deletado com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Erro", 
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const [permissions, setPermissions] = useState({
    admin: { canEditProducts: true, canViewReports: true, canManageUsers: true, canSell: true, canDiscount: true },
    manager: { canEditProducts: true, canViewReports: true, canManageUsers: false, canSell: true, canDiscount: true },
    seller: { canEditProducts: false, canViewReports: false, canManageUsers: false, canSell: true, canDiscount: false },
  });

  const handlePermissionChange = (role: 'admin' | 'manager' | 'seller', key: string, value: boolean) => {
    setPermissions({
      ...permissions,
      [role]: { ...permissions[role as keyof typeof permissions], [key]: value }
    });
  };

  const [actionFilter, setActionFilter] = useState<string>('all');
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings>(() => loadInvoiceSettings());
  const [notesText, setNotesText] = useState(() => loadInvoiceSettings().defaultNotes.join('\n'));
  const [addressLines, setAddressLines] = useState<string[]>(() => loadInvoiceSettings().seller.addressLines ?? []);

  const invoicePreviewData: InvoiceData = {
    invoiceNo: 'MK-2026-000042',
    issuedAt: new Date(),
    currencyLabel: invoiceSettings.currencyLabel,
    seller: { ...invoiceSettings.seller, addressLines },
    customer: { name: 'Cliente exemplo', phone: '+258 84 000 0000' },
    paymentMethod: 'Dinheiro',
    lines: [
      { name: 'Arroz integral 5kg', qty: 1, unit: 'un', unitPrice: 350, total: 350 },
      { name: 'Banana', qty: 2, unit: 'kg', unitPrice: 60, total: 120 },
      { name: 'Leite 1L', qty: 1, unit: 'un', unitPrice: 90, total: 90 },
    ],
    subtotal: 560,
    discount: 20,
    total: 540,
    notes: invoiceSettings.defaultNotes,
    qrValue: invoiceSettings.showQr ? 'MK-2026-000042' : undefined,
    barcodeValue: invoiceSettings.showBarcode ? 'MK-2026-000042' : undefined,
  };

  // Permite abrir uma tab específica via URL: /settings?tab=invoices
  useEffect(() => {
    const qs = location.split('?')[1] ?? '';
    const params = new URLSearchParams(qs);
    const tab = params.get('tab');
    if (tab === 'invoices') setActiveTab('invoices');
    else if (tab === 'audit') setActiveTab('audit');
    else if (tab === 'permissions') setActiveTab('permissions');
    else if (tab === 'users') setActiveTab('users');
    else if (tab === 'rollback') setActiveTab('rollback');
  }, [location]);

  // Mantém o URL sincronizado ao trocar tabs (para o sidebar apontar direto)
  useEffect(() => {
    const base = '/settings';
    const target = activeTab === 'users' ? base : `${base}?tab=${activeTab}`;
    if (location !== target) setLocation(target, { replace: true });
  }, [activeTab]);

  const filteredAuditLogs = auditLogs.filter(log => {
    const logUser = users.find(u => u.id === log.userId);
    const matchesSearch = log.action.toLowerCase().includes(searchHistory.toLowerCase()) ||
      (log.userId && log.userId.toLowerCase().includes(searchHistory.toLowerCase())) ||
      (logUser?.name.toLowerCase().includes(searchHistory.toLowerCase())) ||
      (logUser?.username.toLowerCase().includes(searchHistory.toLowerCase())) ||
      (log.entityId && log.entityId.toLowerCase().includes(searchHistory.toLowerCase()));
    
    const matchesFilter = actionFilter === 'all' || log.action.includes(actionFilter.toUpperCase());
    
    const matchesUserFilter = userFilter === '0' || userFilter === '' || log.userId === userFilter;
    
    return matchesSearch && matchesFilter && matchesUserFilter;
  });

  const getActionIcon = (action: string) => {
    if (action.includes('CREATE')) return <Plus className="h-4 w-4" />;
    if (action.includes('UPDATE') || action.includes('EDIT')) return <Edit className="h-4 w-4" />;
    if (action.includes('DELETE')) return <Trash2 className="h-4 w-4" />;
    if (action.includes('SALE')) return <ShoppingCart className="h-4 w-4" />;
    if (action.includes('PRODUCT')) return <Package className="h-4 w-4" />;
    if (action.includes('USER')) return <Users className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATE')) return 'bg-green-100 text-green-800 border-green-300';
    if (action.includes('UPDATE') || action.includes('EDIT')) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (action.includes('DELETE')) return 'bg-red-100 text-red-800 border-red-300';
    if (action.includes('SALE')) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const auditStats = {
    total: auditLogs.length,
    today: auditLogs.filter(log => {
      const logDate = new Date(log.createdAt);
      const today = new Date();
      return logDate.toDateString() === today.toDateString();
    }).length,
    creates: auditLogs.filter(log => log.action.includes('CREATE')).length,
    sales: auditLogs.filter(log => log.action.includes('SALE')).length,
  };

  const handleSaveUser = () => {
    if (!newUser.username || !newUser.name || !newUser.password) {
      toast({ 
        title: "Erro", 
        description: "Todos os campos são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    if (user?.role !== 'admin') {
      toast({ 
        title: "Acesso negado", 
        description: "Apenas administradores podem criar usuários",
        variant: "destructive"
      });
      return;
    }

    createUserMutation.mutate({
      username: newUser.username,
      name: newUser.name,
      password: newUser.password,
      role: newUser.role
    });
  };

  const isLoading = usersLoading || auditLogsLoading || salesLoading || productsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  const tabDefs = [
    ...(user?.role === 'admin' || user?.role === 'manager'
      ? [{ id: 'users', label: 'Utilizadores', icon: Users, testId: 'tab-users' }]
      : []),
    ...(user?.role === 'admin'
      ? [{ id: 'permissions', label: 'Permissões', icon: Shield, testId: 'tab-permissions' }]
      : []),
    ...(user?.role === 'admin' || user?.role === 'manager'
      ? [
          { id: 'audit', label: 'Rastreio & Auditoria', icon: History, testId: 'tab-audit' },
          { id: 'invoices', label: 'Recibos & Faturas', icon: Receipt, testId: 'tab-invoices' },
          { id: 'rollback', label: 'Reversão de Dados', icon: RotateCcw, testId: 'tab-rollback' },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">

      {/* ── CABEÇALHO — padrão POS/Produtos/Pedidos ── */}
      <div className="overflow-hidden rounded-3xl shadow-sm">
        {/* Banner vermelho */}
        <div className="relative bg-[#B71C1C] px-4 py-4 sm:px-6 sm:py-5">
          <div className="banner-texture" />
          <div className="relative flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
              <Shield className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-white">Administração</h1>
                <span className="hidden text-sm font-normal text-white/50 sm:inline">Sistema &amp; Permissões</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-xs font-semibold text-white/70">
                  {users.length} utilizador{users.length !== 1 ? 'es' : ''}
                </span>
                {auditLogs.length > 0 && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-white/60">
                    <span className="h-1 w-1 rounded-full bg-white/40" />
                    {auditLogs.length} evento{auditLogs.length !== 1 ? 's' : ''} de auditoria
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white px-4 py-3 sm:px-6">
          <div className="grid grid-cols-2 gap-1.5">
            {tabDefs.map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  data-testid={t.testId}
                  className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-[11px] font-semibold transition-all ${
                    active
                      ? 'bg-[#B71C1C] text-white shadow-sm shadow-[#B71C1C]/25'
                      : 'border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
        <TabsList className="sr-only" />

        <UsersTab
          users={users}
          user={user}
          isAddUserOpen={isAddUserOpen}
          setIsAddUserOpen={setIsAddUserOpen}
          newUser={newUser}
          setNewUser={setNewUser}
          handleSaveUser={handleSaveUser}
          createUserMutation={createUserMutation}
          editingUser={editingUser}
          setEditingUser={setEditingUser}
          isEditOpen={isEditOpen}
          setIsEditOpen={setIsEditOpen}
          updateUserMutation={updateUserMutation}
          deletingUserId={deletingUserId}
          setDeletingUserId={setDeletingUserId}
          deleteUserMutation={deleteUserMutation}
          permissions={permissions}
          handlePermissionChange={handlePermissionChange}
        />

        <AuditTab
          users={users}
          auditLogs={auditLogs}
          filteredAuditLogs={filteredAuditLogs}
          auditStats={auditStats}
          searchHistory={searchHistory}
          setSearchHistory={setSearchHistory}
          actionFilter={actionFilter}
          setActionFilter={setActionFilter}
          userFilter={userFilter}
          setUserFilter={setUserFilter}
          orderAuditCode={orderAuditCode}
          setOrderAuditCode={setOrderAuditCode}
          orderAuditMutation={orderAuditMutation}
          orderAuditData={orderAuditData}
          orderAuditOpen={orderAuditOpen}
          setOrderAuditOpen={setOrderAuditOpen}
          getActionIcon={getActionIcon}
          getActionColor={getActionColor}
        />

        <InvoiceSettingsTab
          invoiceSettings={invoiceSettings}
          setInvoiceSettings={setInvoiceSettings}
          notesText={notesText}
          setNotesText={setNotesText}
          addressLines={addressLines}
          setAddressLines={setAddressLines}
          invoicePreviewData={invoicePreviewData}
        />

        <RollbackTab
          user={user}
          auditLogs={auditLogs}
          snapshots={snapshots}
          manualSnapshotLabel={manualSnapshotLabel}
          setManualSnapshotLabel={setManualSnapshotLabel}
          createSnapshotMutation={createSnapshotMutation}
          auditRollbackDate={auditRollbackDate}
          setAuditRollbackDate={setAuditRollbackDate}
          auditRollbackLoading={auditRollbackLoading}
          auditRollbackPreview={auditRollbackPreview}
          rollbackPreview={rollbackPreview}
          rollbackModalOpen={rollbackModalOpen}
          setRollbackModalOpen={setRollbackModalOpen}
          rollbackTarget={rollbackTarget}
          setRollbackTarget={setRollbackTarget}
          rollbackConfirmText={rollbackConfirmText}
          setRollbackConfirmText={setRollbackConfirmText}
          setRollbackPreview={setRollbackPreview}
          setAuditRollbackPreview={setAuditRollbackPreview}
          loadSnapshotPreview={loadSnapshotPreview}
          loadAuditRollbackPreview={loadAuditRollbackPreview}
          restoreSnapshotMutation={restoreSnapshotMutation}
          applyAuditRollbackMutation={applyAuditRollbackMutation}
        />


      </Tabs>
    </div>
  );
}
