import { TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Receipt, Plus } from 'lucide-react';
import { InvoiceA7Template } from '@/components/invoice/InvoiceA7Templates';
import type { InvoiceSettings } from '@/lib/invoiceSettings';
import { saveInvoiceSettings, loadInvoiceSettings } from '@/lib/invoiceSettings';
import { toast } from '@/hooks/use-toast';
import type { InvoiceData } from '@/lib/invoiceModels';

interface InvoiceSettingsTabProps {
  invoiceSettings: InvoiceSettings;
  setInvoiceSettings: React.Dispatch<React.SetStateAction<InvoiceSettings>>;
  notesText: string;
  setNotesText: React.Dispatch<React.SetStateAction<string>>;
  addressLines: string[];
  setAddressLines: React.Dispatch<React.SetStateAction<string[]>>;
  invoicePreviewData: InvoiceData;
}

export function InvoiceSettingsTab({
  invoiceSettings,
  setInvoiceSettings,
  notesText,
  setNotesText,
  addressLines,
  setAddressLines,
  invoicePreviewData,
}: InvoiceSettingsTabProps) {
  return (
    <TabsContent value="invoices" className="space-y-4">
      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">

        {/* Formulário */}
        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">

          {/* Header da secção */}
          <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/60 px-6 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#B71C1C]/10">
              <Receipt className="h-4 w-4 text-[#B71C1C]" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-gray-900">Recibos &amp; Faturas</p>
              <p className="text-[11px] text-gray-500">Configurações impressas em cada fatura gerada</p>
            </div>
          </div>

          <div className="space-y-7 px-6 py-6">

            {/* Seção: Identidade */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-4 w-1 rounded-full bg-[#B71C1C]" />
                <h3 className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">Identidade da Loja</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="ml-1 text-xs font-bold text-gray-600">Nome da loja</Label>
                  <Input
                    className="h-11 rounded-xl border-gray-200 focus-visible:border-[#B71C1C]/40 focus-visible:ring-[#B71C1C]/15"
                    value={invoiceSettings.seller.name}
                    onChange={(e) => setInvoiceSettings((prev) => ({ ...prev, seller: { ...prev.seller, name: e.target.value } }))}
                    placeholder="Ex: ED SALES"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="ml-1 text-xs font-bold text-gray-600">NIF <span className="font-normal text-gray-400">(opcional)</span></Label>
                  <Input
                    className="h-11 rounded-xl border-gray-200 focus-visible:border-[#B71C1C]/40 focus-visible:ring-[#B71C1C]/15"
                    value={invoiceSettings.seller.taxId ?? ''}
                    onChange={(e) => setInvoiceSettings((prev) => ({ ...prev, seller: { ...prev.seller, taxId: e.target.value } }))}
                    placeholder="Ex: 400123456"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="ml-1 text-xs font-bold text-gray-600">Telefone <span className="font-normal text-gray-400">(opcional)</span></Label>
                  <Input
                    className="h-11 rounded-xl border-gray-200 focus-visible:border-[#B71C1C]/40 focus-visible:ring-[#B71C1C]/15"
                    value={invoiceSettings.seller.phone ?? ''}
                    onChange={(e) => setInvoiceSettings((prev) => ({ ...prev, seller: { ...prev.seller, phone: e.target.value } }))}
                    placeholder="Ex: +258 84 000 0000"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="ml-1 text-xs font-bold text-gray-600">Moeda</Label>
                  <Input
                    className="h-11 rounded-xl border-gray-200 focus-visible:border-[#B71C1C]/40 focus-visible:ring-[#B71C1C]/15"
                    value={invoiceSettings.currencyLabel}
                    onChange={(e) => setInvoiceSettings((prev) => ({ ...prev, currencyLabel: e.target.value }))}
                    placeholder="Ex: MT"
                  />
                </div>
              </div>
            </section>

            {/* Seção: Endereço */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-1 rounded-full bg-[#B71C1C]" />
                  <h3 className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">Endereço</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setAddressLines((prev) => [...prev, ''])}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:border-[#B71C1C]/30 hover:bg-[#B71C1C]/5 hover:text-[#B71C1C]"
                >
                  <Plus className="h-3.5 w-3.5" /> Adicionar linha
                </button>
              </div>
              <div className="space-y-2">
                {(addressLines.length ? addressLines : ['']).map((val, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      className="h-11 flex-1 rounded-xl border-gray-200 focus-visible:border-[#B71C1C]/40 focus-visible:ring-[#B71C1C]/15"
                      value={val}
                      onChange={(e) => setAddressLines((prev) => prev.map((x, i) => (i === idx ? e.target.value : x)))}
                      placeholder={idx === 0 ? 'Ex: Av. 25 de Setembro' : 'Ex: Maputo'}
                    />
                    <button
                      type="button"
                      onClick={() => setAddressLines((prev) => prev.filter((_, i) => i !== idx))}
                      disabled={addressLines.length <= 1}
                      className="rounded-xl border border-gray-200 px-3 text-xs font-semibold text-gray-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Seção: Transferências */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-4 w-1 rounded-full bg-[#B71C1C]" />
                <div>
                  <h3 className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">Transferências (Mpesa / Emola)</h3>
                  <p className="mt-0.5 text-[10px] text-gray-400">Visíveis no checkout quando o cliente escolhe transferência</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="ml-1 text-xs font-bold text-gray-600">Número Mpesa</Label>
                  <Input
                    className="h-11 rounded-xl border-gray-200 focus-visible:border-[#B71C1C]/40 focus-visible:ring-[#B71C1C]/15"
                    value={invoiceSettings.transferAccounts?.mpesa ?? ''}
                    onChange={(e) => setInvoiceSettings((prev) => ({ ...prev, transferAccounts: { ...(prev.transferAccounts ?? {}), mpesa: e.target.value } }))}
                    placeholder="Ex: 84 000 0000"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="ml-1 text-xs font-bold text-gray-600">Número Emola</Label>
                  <Input
                    className="h-11 rounded-xl border-gray-200 focus-visible:border-[#B71C1C]/40 focus-visible:ring-[#B71C1C]/15"
                    value={invoiceSettings.transferAccounts?.emola ?? ''}
                    onChange={(e) => setInvoiceSettings((prev) => ({ ...prev, transferAccounts: { ...(prev.transferAccounts ?? {}), emola: e.target.value } }))}
                    placeholder="Ex: 86 000 0000"
                  />
                </div>
              </div>
            </section>

            {/* Seção: Modelo e Opções */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-4 w-1 rounded-full bg-[#B71C1C]" />
                <h3 className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">Modelo &amp; Opções</h3>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {(['classic', 'compact'] as const).map((m) => {
                  const active = invoiceSettings.defaultModel === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setInvoiceSettings((prev) => ({ ...prev, defaultModel: m }))}
                      className={`overflow-hidden rounded-2xl border text-left transition-all ${
                        active
                          ? 'border-[#B71C1C]/40 bg-[#B71C1C]/3 ring-2 ring-[#B71C1C]/20'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-3">
                        <div>
                          <p className="text-sm font-bold text-gray-900">{m === 'classic' ? 'Clássico' : 'Compacto'}</p>
                          <p className="text-[11px] text-gray-400">Toque para definir como padrão</p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                          active ? 'bg-[#B71C1C] text-white' : 'border border-gray-200 text-gray-500'
                        }`}>
                          {active ? 'Padrão' : 'Selecionar'}
                        </span>
                      </div>
                      <div className="bg-gray-50 p-4">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="h-2.5 rounded-md bg-gray-200" />
                          <div className="h-2.5 rounded-md bg-gray-200/80" />
                          <div className="h-2.5 rounded-md bg-gray-200/60" />
                          <div className="col-span-3 h-10 rounded-md bg-gray-200/70" />
                          <div className="col-span-2 h-7 rounded-md bg-gray-200/60" />
                          <div className="h-7 rounded-md bg-gray-200/60" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Mostrar QR Code</p>
                    <p className="text-[11px] text-gray-400">Exibe QR na fatura impressa</p>
                  </div>
                  <Checkbox
                    checked={invoiceSettings.showQr}
                    onCheckedChange={(v) => setInvoiceSettings((prev) => ({ ...prev, showQr: Boolean(v) }))}
                  />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Mostrar Barcode</p>
                    <p className="text-[11px] text-gray-400">Exibe código de barras na fatura</p>
                  </div>
                  <Checkbox
                    checked={invoiceSettings.showBarcode}
                    onCheckedChange={(v) => setInvoiceSettings((prev) => ({ ...prev, showBarcode: Boolean(v) }))}
                  />
                </div>
              </div>
            </section>

            {/* Seção: Notas */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-4 w-1 rounded-full bg-[#B71C1C]" />
                <h3 className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">Notas Padrão</h3>
              </div>
              <Textarea
                value={notesText}
                onChange={(e) => {
                  setNotesText(e.target.value);
                  setInvoiceSettings((prev) => ({
                    ...prev,
                    defaultNotes: e.target.value.split('\n').map((x) => x.trim()).filter(Boolean).slice(0, 5),
                  }));
                }}
                placeholder={"Obrigado pela preferência\nTrocas até 7 dias"}
                className="min-h-[80px] rounded-xl border-gray-200 text-sm focus-visible:border-[#B71C1C]/40 focus-visible:ring-[#B71C1C]/15"
              />
              <p className="ml-1 text-[11px] text-gray-400">Máximo 5 linhas — aparecem no rodapé da fatura</p>
            </section>

          </div>

          {/* Footer com botões */}
          <div className="flex flex-wrap gap-2 border-t border-gray-100 bg-gray-50/60 px-6 py-4">
            <button
              type="button"
              onClick={() => {
                const merged: InvoiceSettings = {
                  ...invoiceSettings,
                  seller: { ...invoiceSettings.seller, addressLines: addressLines.map((x) => x.trim()).filter(Boolean).slice(0, 6) },
                };
                setInvoiceSettings(merged);
                saveInvoiceSettings(merged);
                toast({ title: 'Salvo', description: 'Configurações de fatura aplicadas.' });
              }}
              className="rounded-xl bg-gradient-to-r from-[#B71C1C] to-[#7f1d1d] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-[#B71C1C]/20 transition hover:opacity-90 active:scale-[0.98]"
            >
              Salvar configurações
            </button>
            <button
              type="button"
              onClick={() => {
                const fresh = loadInvoiceSettings();
                setInvoiceSettings(fresh);
                setAddressLines(fresh.seller.addressLines ?? []);
                setNotesText(fresh.defaultNotes.join('\n'));
                toast({ title: 'Recarregado', description: 'Configuração atual recarregada.' });
              }}
              className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
            >
              Recarregar
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="h-fit overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm lg:sticky lg:top-20">
          <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50/60 px-5 py-3.5">
            <div className="h-4 w-1 rounded-full bg-[#B71C1C]" />
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Preview (A7)</p>
          </div>
          <div className="p-5">
            <div className="mx-auto w-fit rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
              <InvoiceA7Template model={invoiceSettings.defaultModel} data={invoicePreviewData} />
            </div>
            <p className="mt-3 text-center text-[11px] text-gray-400">
              Actualiza em tempo real conforme edita
            </p>
          </div>
        </div>

      </div>
    </TabsContent>
  );
}
