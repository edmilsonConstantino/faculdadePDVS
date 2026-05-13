import { Button } from '@/components/ui/button';
import { TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import {
  AlertCircle,
  CalendarIcon,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock,
  RotateCcw,
  TriangleAlert,
} from 'lucide-react';
import type { UseMutationResult } from '@tanstack/react-query';

interface RollbackTarget {
  type: 'snapshot';
  id: string;
  label: string;
}

interface AuditRollbackTarget {
  type: 'audit';
  date: string;
}

interface RollbackTabProps {
  user: any;
  auditLogs: any[];
  snapshots: any[];
  manualSnapshotLabel: string;
  setManualSnapshotLabel: (v: string) => void;
  createSnapshotMutation: UseMutationResult<any, Error, string, unknown>;
  auditRollbackDate: string;
  setAuditRollbackDate: (v: string) => void;
  auditRollbackLoading: boolean;
  auditRollbackPreview: any;
  rollbackPreview: any;
  rollbackModalOpen: boolean;
  setRollbackModalOpen: (open: boolean) => void;
  rollbackTarget: RollbackTarget | AuditRollbackTarget | null;
  setRollbackTarget: (target: RollbackTarget | AuditRollbackTarget | null) => void;
  rollbackConfirmText: string;
  setRollbackConfirmText: (v: string) => void;
  setRollbackPreview: (data: any) => void;
  setAuditRollbackPreview: (data: any) => void;
  loadSnapshotPreview: (snap: any) => Promise<void>;
  loadAuditRollbackPreview: (date: string) => Promise<void>;
  restoreSnapshotMutation: UseMutationResult<any, Error, string, unknown>;
  applyAuditRollbackMutation: UseMutationResult<any, Error, string, unknown>;
}

export function RollbackTab({
  user,
  auditLogs,
  snapshots,
  manualSnapshotLabel,
  setManualSnapshotLabel,
  createSnapshotMutation,
  auditRollbackDate,
  setAuditRollbackDate,
  auditRollbackLoading,
  auditRollbackPreview,
  rollbackPreview,
  rollbackModalOpen,
  setRollbackModalOpen,
  rollbackTarget,
  setRollbackTarget,
  rollbackConfirmText,
  setRollbackConfirmText,
  setRollbackPreview,
  setAuditRollbackPreview,
  loadSnapshotPreview,
  loadAuditRollbackPreview,
  restoreSnapshotMutation,
  applyAuditRollbackMutation,
}: RollbackTabProps) {
  return (
    <>
      <TabsContent value="rollback" className="space-y-5">

        {/* Apenas admin */}
        {user?.role !== 'admin' ? (
          <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-5">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
            <p className="text-sm font-semibold text-red-700">Apenas o administrador pode aceder à reversão de dados.</p>
          </div>
        ) : (<>

        {/* Banner de aviso */}
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div className="text-sm">
            <p className="font-bold text-amber-800">Reversão completa do sistema</p>
            <p className="mt-0.5 text-amber-700">Reverte produtos, categorias, vendas, pedidos e tarefas para o estado do dia escolhido. Apenas o administrador pode fazer isto.</p>
          </div>
        </div>

        {/* Secção 1 — Calendário inteligente (Audit Log) */}
        {(() => {
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - 14);

          // Dates with changes in audit log
          const changesPerDate: Record<string, number> = {};
          auditLogs
            .filter((l: any) => new Date(l.createdAt) >= cutoff)
            .forEach((l: any) => {
              const d = new Date(l.createdAt).toISOString().slice(0, 10);
              changesPerDate[d] = (changesPerDate[d] || 0) + 1;
            });
          const activeDates = Object.keys(changesPerDate).map(d => new Date(d + 'T12:00:00'));
          const today = new Date();
          const selected = auditRollbackDate ? new Date(auditRollbackDate + 'T12:00:00') : undefined;

          return (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              {/* Header */}
              <div className="border-b border-red-100 bg-gradient-to-r from-red-50 to-transparent px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#B71C1C]/10">
                    <RotateCcw className="h-4 w-4 text-[#B71C1C]" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">Voltar no tempo</p>
                    <p className="text-xs text-gray-500">Toca num dia para selecionar e confirmar a reversão</p>
                  </div>
                </div>
              </div>

              {/* Body: stacked on mobile, side-by-side on desktop */}
              <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:p-6">

                {/* Calendar column */}
                <div className="w-full sm:w-auto">
                  <Calendar
                    mode="single"
                    selected={selected}
                    onSelect={(date) => {
                      if (!date) { setAuditRollbackDate(''); return; }
                      setAuditRollbackDate(date.toISOString().slice(0, 10));
                    }}
                    disabled={(date) => {
                      const beforeCutoff = date < cutoff;
                      const afterToday = date > today;
                      return beforeCutoff || afterToday;
                    }}
                    modifiers={{ hasChanges: activeDates }}
                    modifiersClassNames={{ hasChanges: 'relative after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:h-1.5 after:w-1.5 after:rounded-full after:bg-[#B71C1C] after:content-[""]' }}
                    className="[--cell-size:2.75rem] w-full sm:[--cell-size:2.25rem]"
                    classNames={{
                      root: 'w-full',
                      months: 'w-full',
                      month: 'w-full space-y-2',
                      month_caption: 'px-2 py-1',
                      caption_label: 'text-sm font-bold text-gray-800',
                      weekday: 'text-gray-400 font-semibold text-[11px] uppercase tracking-wide',
                      today: 'rounded-xl font-black text-[#B71C1C] bg-red-50',
                      day: 'group/day relative flex-1 aspect-square p-0',
                    }}
                  />
                  {/* Legend */}
                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 px-1">
                    <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
                      <span className="inline-block h-2 w-2 rounded-full bg-[#B71C1C]" />
                      Com alterações
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
                      <span className="inline-block h-2 w-2 rounded-full bg-gray-200" />
                      Sem alterações
                    </span>
                  </div>
                </div>

                {/* Info panel */}
                <div className="flex-1 space-y-3">
                  {auditRollbackDate ? (
                    <>
                      <div className="rounded-xl border border-[#B71C1C]/20 bg-gradient-to-br from-red-50 to-white p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#B71C1C]/10">
                            <CalendarIcon className="h-4 w-4 text-[#B71C1C]" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-[#B71C1C]">Data seleccionada</p>
                            <p className="mt-0.5 text-sm font-black capitalize text-gray-800">
                              {new Date(auditRollbackDate + 'T12:00:00').toLocaleDateString('pt-MZ', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                            </p>
                            <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
                              {changesPerDate[auditRollbackDate]
                                ? `${changesPerDate[auditRollbackDate]} evento(s) registado(s) neste dia`
                                : 'Sem eventos registados — reversão baseada no histórico acumulado'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => loadAuditRollbackPreview(auditRollbackDate)}
                        disabled={auditRollbackLoading}
                        className="h-11 w-full rounded-xl bg-[#B71C1C] text-sm font-bold hover:bg-[#9b1414]"
                      >
                        {auditRollbackLoading ? 'A verificar…' : 'Ver o que muda'}
                        <ChevronRight className="ml-1.5 h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <div className="flex h-full min-h-[140px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-4 text-center">
                      <CalendarIcon className="mb-2 h-7 w-7 text-gray-300" />
                      <p className="text-sm font-semibold text-gray-400">Nenhum dia seleccionado</p>
                      <p className="mt-1 text-xs text-gray-400">Toca num dia no calendário para continuar</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Secção 2 — Snapshots diários */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-gray-50/60 px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-[#B71C1C]" />
                <p className="font-bold text-gray-800">Snapshots guardados</p>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">{snapshots.length}</span>
              </div>
              <div className="flex w-full items-center gap-2 sm:w-auto">
                <input
                  type="text"
                  placeholder="Label (opcional)"
                  value={manualSnapshotLabel}
                  onChange={(e) => setManualSnapshotLabel(e.target.value)}
                  className="h-9 min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#B71C1C]/20 sm:w-40 sm:flex-none"
                />
                <Button
                  size="sm"
                  onClick={() => createSnapshotMutation.mutate(manualSnapshotLabel || `Manual — ${new Date().toLocaleDateString('pt-MZ')}`)}
                  disabled={createSnapshotMutation.isPending}
                  className="h-9 shrink-0 rounded-lg bg-[#B71C1C] px-3 text-xs font-bold hover:bg-[#9b1414]"
                >
                  <Camera className="mr-1.5 h-3 w-3" />
                  {createSnapshotMutation.isPending ? 'A guardar…' : 'Snapshot agora'}
                </Button>
              </div>
            </div>
          </div>

          {snapshots.length === 0 ? (
            <div className="py-12 text-center">
              <Clock className="mx-auto mb-2 h-8 w-8 text-gray-200" />
              <p className="text-sm font-semibold text-gray-400">Nenhum snapshot disponível</p>
              <p className="mt-1 text-xs text-gray-400">O primeiro snapshot automático será criado no próximo arranque do servidor.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {snapshots.map((snap: any) => {
                const date = new Date(snap.createdAt);
                const isToday = date.toDateString() === new Date().toDateString();
                return (
                  <div key={snap.id} className="flex items-center gap-3 px-5 py-3.5">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${snap.type === 'auto' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {snap.type === 'auto' ? <Clock className="h-3.5 w-3.5" /> : <Camera className="h-3.5 w-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-800">{snap.label}</p>
                      <p className="text-xs text-gray-400">
                        {isToday ? 'Hoje' : date.toLocaleDateString('pt-MZ', { day: '2-digit', month: 'short', year: 'numeric' })}
                        {' · '}
                        {date.toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${snap.type === 'auto' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {snap.type === 'auto' ? 'Auto' : 'Manual'}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => loadSnapshotPreview(snap)}
                      className="h-7 shrink-0 rounded-lg border-gray-200 px-2.5 text-xs font-semibold text-gray-600 hover:border-[#B71C1C] hover:text-[#B71C1C]"
                    >
                      Restaurar
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        </>)}
      </TabsContent>

      {/* ── MODAL DE CONFIRMAÇÃO DE REVERSÃO ── */}
      <Dialog open={rollbackModalOpen} onOpenChange={(o) => { setRollbackModalOpen(o); if (!o) { setRollbackConfirmText(''); setRollbackPreview(null); setAuditRollbackPreview(null); setRollbackTarget(null); } }}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-black">
              <RotateCcw className="h-5 w-5 text-[#B71C1C]" />
              Confirmar Reversão
            </DialogTitle>
            <DialogDescription>
              {rollbackTarget?.type === 'snapshot'
                ? `Restaurar para snapshot: "${rollbackTarget.label}"`
                : rollbackTarget?.type === 'audit'
                ? `Reverter alterações após ${rollbackTarget.date}`
                : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Preview de alterações */}
            {(rollbackPreview || auditRollbackPreview) && (() => {
              const preview = rollbackPreview || auditRollbackPreview;
              const changes = preview.productChanges || preview.changes || [];
              return (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
                    {changes.length === 0 ? 'Nenhuma alteração detectada' : `${changes.length} produto(s) afectado(s)`}
                  </p>
                  {changes.length === 0 ? (
                    <div className="flex items-center gap-2 text-sm text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" />
                      O estado actual já corresponde ao ponto escolhido.
                    </div>
                  ) : (
                    <div className="max-h-48 space-y-2 overflow-y-auto">
                      {changes.slice(0, 10).map((c: any) => (
                        <div key={c.id} className="rounded-lg border border-gray-200 bg-white p-2.5">
                          <p className="text-xs font-bold text-gray-700">{c.name || c.productName}</p>
                          {c.status === 'recreate' && <p className="mt-0.5 text-[11px] text-blue-600">→ Será recriado (foi apagado)</p>}
                          {(c.changes || c.revert) && Object.entries(c.changes || c.revert).map(([field, val]: [string, any]) => (
                            <p key={field} className="mt-0.5 text-[11px] text-gray-500">
                              {field}: <span className="font-semibold text-[#B71C1C]">{c.changes ? `${val.from} → ${val.to}` : String(val)}</span>
                            </p>
                          ))}
                        </div>
                      ))}
                      {changes.length > 10 && <p className="text-center text-xs text-gray-400">… e mais {changes.length - 10}</p>}
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              <strong>Vendas e pedidos NÃO são alterados.</strong> Apenas produtos e categorias serão revertidos.
            </div>

          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRollbackModalOpen(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button
              disabled={restoreSnapshotMutation.isPending || applyAuditRollbackMutation.isPending}
              onClick={() => {
                if (rollbackTarget?.type === 'snapshot') restoreSnapshotMutation.mutate(rollbackTarget.id);
                else if (rollbackTarget?.type === 'audit') applyAuditRollbackMutation.mutate(rollbackTarget.date);
              }}
              className="rounded-xl bg-[#B71C1C] font-bold hover:bg-[#9b1414]"
            >
              {(restoreSnapshotMutation.isPending || applyAuditRollbackMutation.isPending) ? 'A restaurar…' : 'Restaurar agora'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
