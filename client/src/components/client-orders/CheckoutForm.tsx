import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Check } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { CartItem } from './ProductBrowser';

export interface CheckoutFormData {
  customerName: string;
  customerPhone: string;
  paymentMethod: 'cash' | 'transfer' | 'mpesa' | 'emola' | 'bank';
}

export interface CheckoutFormProps {
  isMobile: boolean;
  checkoutOpen: boolean;
  formData: CheckoutFormData;
  paymentProofDataUrl: string;
  cart: CartItem[];
  total: number;
  isSubmitting: boolean;
  transferInfo: { mpesa?: string; emola?: string } | null | undefined;
  onFormDataChange: (data: CheckoutFormData) => void;
  onPaymentProofChange: (dataUrl: string) => void;
  onConfirm: () => void;
  onBack: () => void;
}

function CheckoutFields({
  formData,
  paymentProofDataUrl,
  cart,
  total,
  isSubmitting,
  transferInfo,
  onFormDataChange,
  onPaymentProofChange,
  onConfirm,
  onBack,
  mobile,
}: Omit<CheckoutFormProps, 'isMobile' | 'checkoutOpen'> & { mobile: boolean }) {
  return (
    <div className={mobile ? 'mt-5 space-y-5' : 'space-y-6'}>
      <div className={`grid gap-${mobile ? '3' : '4'} ${mobile ? '' : 'grid-cols-1 md:grid-cols-2'}`}>
        <div className="space-y-2">
          <Label>{mobile ? 'Nome' : 'Nome Completo'}</Label>
          <Input
            placeholder="Seu nome"
            value={formData.customerName}
            onChange={(e) => onFormDataChange({ ...formData, customerName: e.target.value })}
            className={mobile ? 'h-12 rounded-2xl border-gray-200 bg-gray-50' : 'border-gray-200'}
          />
        </div>
        <div className="space-y-2">
          <Label>Telefone</Label>
          <Input
            placeholder="+258 84 xxx xxxx"
            value={formData.customerPhone}
            onChange={(e) => onFormDataChange({ ...formData, customerPhone: e.target.value })}
            className={mobile ? 'h-12 rounded-2xl border-gray-200 bg-gray-50' : 'border-gray-200'}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>{mobile ? 'Pagamento' : 'Forma de Pagamento'}</Label>
        <Select value={formData.paymentMethod} onValueChange={(val: any) => onFormDataChange({ ...formData, paymentMethod: val })}>
          <SelectTrigger className={mobile ? 'h-12 rounded-2xl border-gray-200 bg-gray-50' : 'border-gray-200'}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">{mobile ? '' : '💵 '}Dinheiro (ao levantar)</SelectItem>
            <SelectItem value="transfer">{mobile ? '' : '🏦 '}Transferência</SelectItem>
            <SelectItem value="mpesa">{mobile ? '' : '📲 '}Mpesa</SelectItem>
            <SelectItem value="emola">{mobile ? '' : '📲 '}Emola</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(formData.paymentMethod === 'mpesa' || formData.paymentMethod === 'emola') && (
        <div className={`rounded-2xl border border-gray-200 bg-gray-50 p-4${mobile ? '' : ''}`}>
          {mobile ? (
            <>
              <p className="text-sm font-black text-gray-900">Pagamento por {formData.paymentMethod === 'mpesa' ? 'Mpesa' : 'Emola'}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Use o número abaixo para transferir e depois venha levantar com o código do pedido.
              </p>
              <div className="mt-3 rounded-xl border border-gray-200 bg-white px-3 py-2">
                <p className="text-xs font-semibold text-muted-foreground">Número</p>
                <p className="mt-0.5 font-mono text-lg font-black text-[#B71C1C]">
                  {formData.paymentMethod === 'mpesa' ? (transferInfo?.mpesa || '—') : (transferInfo?.emola || '—')}
                </p>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Número para transferência —{' '}
              {formData.paymentMethod === 'mpesa' ? 'Mpesa' : 'Emola'}:{' '}
              <span className="font-mono font-black text-[#B71C1C]">
                {formData.paymentMethod === 'mpesa' ? (transferInfo?.mpesa || '—') : (transferInfo?.emola || '—')}
              </span>
            </p>
          )}
        </div>
      )}

      {formData.paymentMethod === 'transfer' && (
        <div className={`rounded-2xl border border-gray-200 bg-gray-50 p-4${mobile ? '' : ' space-y-3'}`}>
          <div className={mobile ? '' : ''}>
            <p className="text-sm font-black text-gray-900">Comprovativo (obrigatório)</p>
            <p className={`${mobile ? 'mt-1 ' : ''}text-xs text-muted-foreground`}>
              Anexe uma imagem do comprovativo. (PNG/JPG)
            </p>
          </div>
          <div className={mobile ? 'mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center' : 'mt-3 flex gap-2 items-center'}>
            <Input
              type="file"
              accept="image/*"
              className={mobile ? 'h-12 rounded-2xl border-gray-200 bg-white' : 'border-gray-200 bg-white'}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                if (!f.type.startsWith('image/')) {
                  toast({ title: 'Arquivo inválido', description: 'Escolha uma imagem (PNG/JPG).', variant: 'destructive' });
                  return;
                }
                if (f.size > 2.5 * 1024 * 1024) {
                  toast({ title: 'Muito grande', description: 'Use uma imagem até 2.5MB.', variant: 'destructive' });
                  return;
                }
                const reader = new FileReader();
                reader.onload = () => {
                  onPaymentProofChange(String(reader.result || ''));
                };
                reader.readAsDataURL(f);
              }}
            />
            <Button
              type="button"
              variant="outline"
              className={mobile ? 'h-12 rounded-2xl' : ''}
              onClick={() => onPaymentProofChange('')}
              disabled={!paymentProofDataUrl}
            >
              Remover
            </Button>
          </div>
          {paymentProofDataUrl && (
            <div className={`mt-3 overflow-hidden ${mobile ? 'rounded-2xl' : 'rounded-xl'} border border-gray-200 bg-white`}>
              <img src={paymentProofDataUrl} alt="" className={`${mobile ? 'h-48' : 'h-44'} w-full object-cover`} />
            </div>
          )}
        </div>
      )}

      {/* Order summary */}
      <div className={`${mobile ? 'rounded-2xl border border-gray-200 bg-gray-50 p-4' : 'bg-gray-50 p-4 rounded-lg space-y-2'}`}>
        <p className={`${mobile ? 'text-sm font-black text-gray-900' : 'font-semibold'}`}>
          {mobile ? 'Resumo' : 'Resumo do Pedido:'}
        </p>
        <div className={`${mobile ? 'mt-2 space-y-1.5 text-sm' : 'space-y-1 text-sm'}`}>
          {cart.map((item) => (
            <div key={item.productId} className="flex justify-between gap-3">
              <span className="min-w-0 truncate font-medium text-gray-900">
                {item.product?.name} <span className="text-muted-foreground">× {item.quantity}</span>
              </span>
              <span className="shrink-0 font-black text-gray-900">{formatCurrency(item.priceAtSale * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className={`${mobile ? 'mt-3 flex items-end justify-between border-t border-gray-200/60 pt-3' : 'border-t border-gray-200 pt-2 flex justify-between font-bold text-lg'}`}>
          <span className={`${mobile ? 'text-sm font-black uppercase tracking-wide text-gray-900/80' : ''}`}>Total{mobile ? '' : ':'}</span>
          <span className={`${mobile ? 'font-heading text-2xl font-black text-[#B71C1C]' : 'text-[#B71C1C]'}`}>{formatCurrency(total)}</span>
        </div>
      </div>

      <div className={`${mobile ? 'grid grid-cols-2 gap-3' : 'flex gap-3'}`}>
        <Button
          variant="outline"
          onClick={onBack}
          className={mobile ? 'h-12 rounded-2xl' : 'flex-1'}
        >
          Voltar
        </Button>
        <Button
          onClick={onConfirm}
          disabled={isSubmitting}
          className={`${mobile ? 'h-12 rounded-2xl bg-[#B71C1C] hover:bg-[#9b1414] gap-2 font-black' : 'flex-1 bg-[#B71C1C] hover:bg-[#9b1414] gap-2'}`}
        >
          <Check className="h-4 w-4" />
          {isSubmitting ? (mobile ? 'Criando…' : 'Criando...') : (mobile ? 'Confirmar' : 'Confirmar Pedido')}
        </Button>
      </div>
    </div>
  );
}

export function CheckoutForm(props: CheckoutFormProps) {
  const { isMobile, checkoutOpen, ...rest } = props;

  // Mobile: bottom sheet
  const mobileSheet = (
    <Sheet
      open={checkoutOpen && isMobile}
      onOpenChange={(open) => { if (!open) props.onBack(); }}
    >
      <SheetContent
        side="bottom"
        className="max-h-[92dvh] overflow-y-auto rounded-t-[2rem] border-0 border-t border-border/70 bg-white p-0 shadow-xl md:hidden"
      >
        <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-muted-foreground/25" aria-hidden />
        <div className="px-5 pb-6 pt-4">
          <SheetHeader className="space-y-1 text-left">
            <SheetTitle className="font-heading text-2xl font-black">Finalizar pedido</SheetTitle>
            <SheetDescription className="text-sm font-medium">
              Preencha em 10 segundos e confirme.
            </SheetDescription>
          </SheetHeader>
          <CheckoutFields {...rest} mobile={true} />
        </div>
      </SheetContent>
    </Sheet>
  );

  // Desktop: card
  const desktopCard = checkoutOpen ? (
    <div className="mx-auto hidden max-w-2xl md:block">
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle>Finalizar Pedido</CardTitle>
        </CardHeader>
        <CardContent>
          <CheckoutFields {...rest} mobile={false} />
        </CardContent>
      </Card>
    </div>
  ) : null;

  return (
    <>
      {mobileSheet}
      {desktopCard}
    </>
  );
}
