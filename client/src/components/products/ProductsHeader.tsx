import { Package, PackageX, TrendingDown, Clock, AlertTriangle, Wallet, TrendingUp, BarChart2, FileUp, FileDown } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatCurrency } from '@/lib/utils';

interface EditCount {
  count: number;
  limit: number;
  canEdit: boolean;
}

interface InventoryFinancials {
  capitalInStock: number;
  saleValueInStock: number;
  avgMargin: number;
}

interface ProductsHeaderProps {
  totalProducts: number;
  outOfStockCount: number;
  lowStockCount: number;
  recentlyEditedCount: number;
  editCount: EditCount | undefined;
  inventoryFinancials: InventoryFinancials | null;
  onImportClick: () => void;
  onExportClick: () => void;
  addFormSlot: React.ReactNode;
}

export function ProductsHeader({
  totalProducts,
  outOfStockCount,
  lowStockCount,
  recentlyEditedCount,
  editCount,
  inventoryFinancials,
  onImportClick,
  onExportClick,
  addFormSlot,
}: ProductsHeaderProps) {
  return (
    <>
      {/* ── BANNER ── */}
      <div className="overflow-hidden rounded-3xl shadow-sm">
        <div className="relative bg-[#B71C1C] px-4 py-4 sm:px-6 sm:py-5">
          <div className="banner-texture" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Título */}
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
                <Package className="h-5 w-5 text-white" strokeWidth={2.5} />
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <h1 className="text-xl font-extrabold tracking-tight text-white">Produtos</h1>
                  <span className="hidden text-sm font-normal text-white/50 sm:inline">Catálogo &amp; Inventário</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-xs font-semibold text-white/70">
                    {totalProducts} produto{totalProducts !== 1 ? 's' : ''}
                  </span>
                  {outOfStockCount > 0 && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-red-200">
                      <span className="h-1 w-1 rounded-full bg-red-300" />
                      {outOfStockCount} sem estoque
                    </span>
                  )}
                  {lowStockCount > 0 && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-amber-200">
                      <span className="h-1 w-1 rounded-full bg-amber-300" />
                      {lowStockCount} abaixo do mínimo
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Acções */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onImportClick}
                className="flex items-center gap-1.5 rounded-xl border border-white/25 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
                data-testid="button-import"
              >
                <FileUp className="h-3.5 w-3.5" />
                Importar
              </button>
              <button
                type="button"
                onClick={onExportClick}
                className="flex items-center gap-1.5 rounded-xl border border-white/25 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
                data-testid="button-export"
              >
                <FileDown className="h-3.5 w-3.5" />
                Exportar
              </button>
              {addFormSlot}
            </div>
          </div>
        </div>
      </div>

      {/* ── ALERTA EDIÇÕES ── */}
      {editCount && editCount.count > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Você fez {editCount.count} de {editCount.limit} edições permitidas hoje.
            {!editCount.canEdit && ' Limite atingido!'}
          </AlertDescription>
        </Alert>
      )}

      {/* ── CARDS DE RESUMO ── */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[0.7rem] font-bold uppercase tracking-widest text-gray-400">Total</p>
              <p className="mt-1 text-2xl font-extrabold tabular-nums text-gray-900">{totalProducts}</p>
            </div>
            <div className="rounded-xl bg-gray-100 p-2"><Package className="h-5 w-5 text-gray-500" /></div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl bg-gray-300" />
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-red-50 p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[0.7rem] font-bold uppercase tracking-widest text-[#B71C1C]/70">Sem estoque</p>
              <p className="mt-1 text-2xl font-extrabold tabular-nums text-[#B71C1C]">{outOfStockCount}</p>
            </div>
            <div className="rounded-xl bg-red-100 p-2"><PackageX className="h-5 w-5 text-[#B71C1C]" /></div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl bg-[#B71C1C]" />
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-amber-100 bg-amber-50 p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[0.7rem] font-bold uppercase tracking-widest text-amber-500">Abaixo do mínimo</p>
              <p className="mt-1 text-2xl font-extrabold tabular-nums text-amber-700">{lowStockCount}</p>
            </div>
            <div className="rounded-xl bg-amber-100 p-2"><TrendingDown className="h-5 w-5 text-amber-600" /></div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl bg-amber-400" />
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[0.7rem] font-bold uppercase tracking-widest text-gray-400">Editados (24h)</p>
              <p className="mt-1 text-2xl font-extrabold tabular-nums text-gray-900">{recentlyEditedCount}</p>
            </div>
            <div className="rounded-xl bg-gray-100 p-2"><Clock className="h-5 w-5 text-gray-500" /></div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl bg-gray-300" />
        </div>
      </div>

      {/* ── FINANCEIRO (admin/gestor) ── */}
      {inventoryFinancials && (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-5 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#B71C1C]/10">
                <BarChart2 className="h-3.5 w-3.5 text-[#B71C1C]" strokeWidth={2.5} />
              </div>
              <p className="text-sm font-bold text-gray-700">Análise Financeira do Inventário</p>
            </div>
            <span className="rounded-full border border-[#B71C1C]/15 bg-[#B71C1C]/8 px-2.5 py-0.5 text-[10px] font-bold text-[#B71C1C]">Admin / Gestor</span>
          </div>
          <div className="grid grid-cols-1 divide-y divide-gray-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#B71C1C]/8">
                <Wallet className="h-5 w-5 text-[#B71C1C]" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Capital em stock</p>
                <p className="mt-0.5 text-lg font-extrabold tabular-nums text-gray-900">
                  {inventoryFinancials.capitalInStock > 0 ? formatCurrency(inventoryFinancials.capitalInStock) : '—'}
                </p>
                <p className="text-[11px] text-gray-400">Custo total em inventário</p>
              </div>
            </div>
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Valor de venda em stock</p>
                <p className="mt-0.5 text-lg font-extrabold tabular-nums text-emerald-700">
                  {inventoryFinancials.saleValueInStock > 0 ? formatCurrency(inventoryFinancials.saleValueInStock) : '—'}
                </p>
                <p className="text-[11px] text-gray-400">Receita potencial do stock</p>
              </div>
            </div>
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50">
                <BarChart2 className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Margem média</p>
                <p className="mt-0.5 text-lg font-extrabold tabular-nums text-gray-900">
                  {inventoryFinancials.avgMargin > 0 ? `${inventoryFinancials.avgMargin.toFixed(1)}%` : '—'}
                </p>
                <p className="text-[11px] text-gray-400">Média sobre produtos c/ custo</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
