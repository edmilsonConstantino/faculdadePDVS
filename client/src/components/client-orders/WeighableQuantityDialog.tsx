import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Minus, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Product } from '@/lib/api';

export interface WeighableQuantityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedWeighableProduct: Product | null;
  weighableQuantity: number;
  setWeighableQuantity: (qty: number) => void;
  onConfirm: () => void;
}

export function WeighableQuantityDialog({
  open,
  onOpenChange,
  selectedWeighableProduct,
  weighableQuantity,
  setWeighableQuantity,
  onConfirm,
}: WeighableQuantityDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quantidade em Gramas</DialogTitle>
        </DialogHeader>
        {selectedWeighableProduct && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="font-semibold text-lg">{selectedWeighableProduct.name}</p>
              <p className="text-sm text-muted-foreground mt-1">Preço: {formatCurrency(parseFloat(selectedWeighableProduct.price))}/kg</p>
            </div>
            <div className="space-y-2">
              <Label>Quantidade (gramas)</Label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setWeighableQuantity(Math.max(100, weighableQuantity - 100))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={weighableQuantity}
                  onChange={(e) => setWeighableQuantity(Math.max(100, parseInt(e.target.value) || 100))}
                  className="text-center text-lg font-semibold border-gray-200"
                  min="100"
                  step="100"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setWeighableQuantity(weighableQuantity + 100)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                = {(weighableQuantity / 1000).toFixed(2)} kg
              </p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 flex gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-sm text-blue-900">Preço total: {formatCurrency((parseFloat(selectedWeighableProduct.price) / 1000) * weighableQuantity)}</p>
            </div>
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onConfirm} className="bg-[#B71C1C] hover:bg-[#9b1414]">Adicionar ao Carrinho</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
