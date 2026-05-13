import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Camera,
  QrCode,
  Smartphone,
  Monitor,
  Trash2,
  RefreshCw,
  Share2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import QRCode from 'react-qr-code';
import { BarcodeCameraScan } from '@/components/BarcodeCameraScan';
import { scannerApi, networkApi, type ScannerSessionInfo } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { useMediaQuery } from '@/hooks/use-media-query';

/* ------------------------------------------------------------------ */
/* CameraScanDialog                                                      */
/* ------------------------------------------------------------------ */

export interface CameraScanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (barcode: string) => void;
}

export function CameraScanDialog({ open, onOpenChange, onScan }: CameraScanDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-h-[min(96dvh,920px)] gap-0 overflow-y-auto p-0 sm:max-w-lg sm:gap-4 sm:p-6',
          'max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:top-[6dvh] max-md:h-auto max-md:max-h-[94dvh] max-md:w-full max-md:max-w-none max-md:translate-x-0 max-md:translate-y-0 max-md:rounded-t-[1.75rem] max-md:border-x-0 max-md:border-b-0',
        )}
        aria-describedby="camera-scan-desc"
      >
        <div className="max-md:bg-gradient-to-br max-md:from-[#B71C1C] max-md:via-[#1A1A2E] max-md:to-[#1B3A5C] max-md:px-5 max-md:pb-4 max-md:pt-5 max-md:text-primary-foreground sm:contents">
          <DialogHeader className="space-y-1 px-5 pt-4 text-left sm:space-y-1.5 sm:px-0 sm:pt-0 sm:text-left">
            <DialogTitle className="flex items-center gap-2 font-heading text-lg sm:text-xl">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/30 max-md:text-white sm:bg-primary/10 sm:text-primary sm:ring-primary/20">
                <Camera className="h-5 w-5" />
              </span>
              <span className="max-md:text-white">Ler código de barras</span>
            </DialogTitle>
            <DialogDescription
              id="camera-scan-desc"
              className="text-sm max-md:text-white/85 sm:text-muted-foreground"
            >
              Escolha câmera traseira ou frontal, alinhe o código e capture.
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="px-4 pb-4 pt-2 sm:px-0 sm:pb-0 sm:pt-0">
          <BarcodeCameraScan
            id="pos-camera-scan"
            onScan={onScan}
            onClose={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* RemoteScannerPoller                                                   */
/* ------------------------------------------------------------------ */

export interface RemoteScannerPollerProps {
  token: string;
  onBarcode: (b: string) => void;
  onClose: () => void;
}

export function RemoteScannerPoller({ token, onBarcode, onClose }: RemoteScannerPollerProps) {
  useEffect(() => {
    const t = setInterval(async () => {
      try {
        const { barcodes } = await scannerApi.poll(token);
        barcodes.forEach(onBarcode);
      } catch {
        onClose();
      }
    }, 300);
    return () => clearInterval(t);
  }, [token, onBarcode, onClose]);
  return null;
}

/* ------------------------------------------------------------------ */
/* helpers                                                               */
/* ------------------------------------------------------------------ */

function formatTimeAgo(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}min`;
}

function formatDeviceLabel(s: ScannerSessionInfo): string {
  const dt = s.deviceType === 'mobile' ? 'Celular' : s.deviceType === 'desktop' ? 'Computador' : 'Dispositivo';
  const ua =
    s.userAgent && s.userAgent.length > 0
      ? s.userAgent.length > 40
        ? s.userAgent.slice(0, 40) + '…'
        : s.userAgent
      : 'N/A';
  return `${dt} • ${ua}`;
}

/* ------------------------------------------------------------------ */
/* RemoteScannerDialog                                                   */
/* ------------------------------------------------------------------ */

export interface RemoteScannerDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  token: string | null;
  url: string;
  onTokenChange: (t: string | null, u: string) => void;
  onSessionsChange: (s: ScannerSessionInfo[]) => void;
}

export function RemoteScannerDialog({
  open,
  onOpenChange,
  token,
  url,
  onTokenChange,
  onSessionsChange,
}: RemoteScannerDialogProps) {
  const [sessions, setSessions] = useState<ScannerSessionInfo[]>([]);
  const [renewing, setRenewing] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState<string | null>(null);
  const isMobileViewport = useMediaQuery('(max-width: 767px)');

  useEffect(() => {
    if (open) {
      networkApi.getLocalAccess().then((r) => setBaseUrl(r.baseUrl)).catch(() => setBaseUrl(null));
    }
  }, [open]);

  const loadSessions = () => {
    scannerApi
      .sessions()
      .then((list) => { setSessions(list); onSessionsChange(list); })
      .catch(() => { setSessions([]); });
  };

  useEffect(() => {
    if (open) loadSessions();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = setInterval(loadSessions, 5000);
    return () => clearInterval(t);
  }, [open]);

  const handleRenew = async () => {
    if (!token) return;
    setRenewing(true);
    try {
      const { token: t, url: u } = await scannerApi.renew(token);
      onTokenChange(t, u);
      toast({ title: 'Link renovado', description: 'A validade foi reposta: mais 7 dias a partir de agora.' });
      loadSessions();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erro', description: e instanceof Error ? e.message : 'Não foi possível renovar' });
    } finally {
      setRenewing(false);
    }
  };

  const handleRevoke = async (t: string) => {
    setRevoking(t);
    try {
      await scannerApi.revoke(t);
      toast({ title: 'Sessão revogada' });
      if (t === token) onTokenChange(null, '');
      loadSessions();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erro', description: e instanceof Error ? e.message : 'Não foi possível revogar' });
    } finally {
      setRevoking(null);
    }
  };

  const handleNewLink = async () => {
    try {
      const { token: newToken, url: newUrl } = await scannerApi.start();
      onTokenChange(newToken, newUrl);
      loadSessions();
      toast({ title: 'Novo link gerado' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erro', description: e instanceof Error ? e.message : 'Não foi possível gerar link' });
    }
  };

  const handleShareLink = async () => {
    if (!url) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'ED SALES — Scanner remoto', text: 'Abra no telemóvel para ler códigos de barras no PDV.', url });
        toast({ title: 'Partilhado', description: 'Escolha a app no telemóvel.' });
        return;
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Link copiado', description: 'Cole no navegador do telemóvel.' });
    } catch {
      toast({ variant: 'destructive', title: 'Não foi possível copiar' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="mx-auto flex max-h-[min(92dvh,720px)] w-full max-w-md flex-col overflow-hidden rounded-[1.75rem] border-0 p-0 sm:max-w-lg"
        aria-describedby="remote-scanner-desc"
      >
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-[#B71C1C] to-[#7F1D1D] px-5 pb-6 pt-5 text-primary-foreground">
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30">
              <QrCode className="h-6 w-6" strokeWidth={2.25} />
            </div>
            <div>
              <DialogTitle className="font-heading text-xl font-bold tracking-tight text-white">
                Scanner no telemóvel
              </DialogTitle>
              <DialogDescription id="remote-scanner-desc" className="mt-1 text-sm font-medium text-white/85">
                Aponte a câmara para os códigos — entram no carrinho deste PDV.
              </DialogDescription>
            </div>
          </div>
          {baseUrl && (
            <p className="mt-4 rounded-xl bg-black/15 px-3 py-2 text-[0.7rem] text-white/90">
              Servidor: <span className="font-mono text-white">{baseUrl}</span>
            </p>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {token && url ? (
            <div className="space-y-4">
              {url.startsWith('http://') && (
                <div className="flex gap-2 rounded-xl border border-amber-200/80 bg-amber-50 px-3 py-2.5 dark:border-amber-800 dark:bg-amber-950/30">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <p className="text-xs leading-relaxed text-amber-900 dark:text-amber-200">
                    A câmara no telemóvel precisa de <strong>HTTPS</strong>. Use{' '}
                    <code className="rounded bg-amber-100 px-1 font-mono dark:bg-amber-900">HTTPS=1</code> no .env e reinicie.
                  </p>
                </div>
              )}

              <Tabs defaultValue="qr" className="w-full">
                <TabsList className="grid h-11 w-full grid-cols-2 rounded-xl bg-muted/80 p-1">
                  <TabsTrigger value="qr" className="rounded-lg font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm">
                    <QrCode className="mr-2 h-4 w-4" />
                    QR Code
                  </TabsTrigger>
                  <TabsTrigger value="link" className="rounded-lg font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm">
                    Link
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="qr" className="mt-4 space-y-3 outline-none">
                  <p className="text-center text-xs font-medium text-muted-foreground">
                    Leia com a câmara do telemóvel ou app de QR
                  </p>
                  <div className="relative mx-auto w-fit">
                    <div
                      className="absolute -inset-1 rounded-[1.35rem] bg-gradient-to-br from-primary via-accent to-[hsl(262_72%_58%)] opacity-90 blur-[2px]"
                      aria-hidden
                    />
                    <div className="relative rounded-3xl bg-white p-4 shadow-xl">
                      <QRCode
                        value={url}
                        size={200}
                        level="M"
                        fgColor="#1A1A2E"
                        bgColor="#ffffff"
                        style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                      />
                    </div>
                  </div>
                  <div className={cn('flex flex-col gap-2', !isMobileViewport && 'sm:flex-row')}>
                    {!isMobileViewport && (
                      <Button
                        type="button"
                        className="h-11 flex-1 rounded-xl border-0 bg-gradient-to-r from-[#B71C1C] to-[#1B3A5C] font-bold text-primary-foreground shadow-md"
                        onClick={handleShareLink}
                      >
                        <Share2 className="mr-2 h-4 w-4" />
                        Partilhar link
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant={isMobileViewport ? 'default' : 'outline'}
                      className={cn(
                        'h-11 rounded-xl font-semibold',
                        isMobileViewport
                          ? 'border-0 bg-gradient-to-r from-[#B71C1C] to-[#1B3A5C] font-bold text-primary-foreground shadow-md'
                          : 'flex-1',
                      )}
                      onClick={() => {
                        navigator.clipboard.writeText(url);
                        toast({ title: 'Link copiado' });
                      }}
                    >
                      Copiar URL
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="link" className="mt-4 space-y-3 outline-none">
                  <div className="rounded-2xl border border-border bg-muted/40 p-3">
                    <p className="text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground">Endereço completo</p>
                    <div
                      className="mt-2 max-h-24 overflow-auto rounded-xl border border-border bg-background p-3"
                      style={{ WebkitOverflowScrolling: 'touch' }}
                    >
                      <p className="break-all font-mono text-[11px] leading-relaxed text-foreground">{url}</p>
                    </div>
                  </div>
                  <div className={cn('flex flex-col gap-2', !isMobileViewport && 'sm:flex-row')}>
                    <Button
                      type="button"
                      variant="default"
                      className={cn(
                        'h-11 rounded-xl font-bold',
                        !isMobileViewport && 'flex-1',
                        isMobileViewport && 'border-0 bg-gradient-to-r from-[#B71C1C] to-[#1B3A5C] text-primary-foreground shadow-md',
                      )}
                      onClick={() => {
                        navigator.clipboard.writeText(url);
                        toast({ title: 'Link copiado!' });
                      }}
                    >
                      Copiar link
                    </Button>
                    {!isMobileViewport && (
                      <Button type="button" variant="outline" className="h-11 flex-1 rounded-xl font-semibold" onClick={handleShareLink}>
                        <Share2 className="mr-2 h-4 w-4" />
                        Partilhar…
                      </Button>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" className="h-11 rounded-xl font-semibold" onClick={handleRenew} disabled={renewing}>
                  <RefreshCw className={cn('mr-2 h-4 w-4', renewing && 'animate-spin')} />
                  Renovar (7 dias)
                </Button>
                <Button
                  variant="outline"
                  className="h-11 rounded-xl border-destructive/35 font-semibold text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    handleRevoke(token);
                    onOpenChange(false);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Desligar
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={handleNewLink}
              className="h-12 w-full rounded-2xl border-0 bg-gradient-to-r from-[#B71C1C] to-[#7F1D1D] text-base font-bold text-primary-foreground shadow-lg"
            >
              <Smartphone className="mr-2 h-5 w-5" />
              Gerar sessão e QR
            </Button>
          )}

          <div className="mt-6 border-t border-border pt-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-bold text-foreground">Sessões ativas</p>
              {sessions.length > 0 && (
                <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-bold text-primary">{sessions.length}</span>
              )}
            </div>
            {sessions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border py-8 text-center text-muted-foreground">
                <Monitor className="mx-auto mb-2 h-9 w-9 opacity-35" />
                <p className="text-xs">Nenhum telemóvel ligado ainda.</p>
              </div>
            ) : (
              <div className="max-h-40 divide-y overflow-y-auto rounded-2xl border border-border">
                {sessions.map((s) => (
                  <div key={s.token} className="flex items-center justify-between gap-3 bg-muted/20 px-3 py-2.5">
                    <div className="min-w-0 flex items-center gap-2">
                      {s.deviceType === 'mobile' ? (
                        <Smartphone className="h-4 w-4 shrink-0 text-primary" />
                      ) : (
                        <Monitor className="h-4 w-4 shrink-0 text-accent" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{formatDeviceLabel(s)}</p>
                        <p className="text-xs text-muted-foreground">Há {formatTimeAgo(Date.now() - s.lastAccess)}</p>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0 text-destructive hover:bg-destructive/10"
                      onClick={() => handleRevoke(s.token)}
                      disabled={revoking === s.token}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="mt-4 text-center text-[0.7rem] leading-relaxed text-muted-foreground">
            O link expira após 7 dias sem renovar. Os códigos lidos no telemóvel entram neste PDV — revogue sessões que não
            reconhecer.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
