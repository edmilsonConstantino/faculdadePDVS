import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TabsContent } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Edit, Trash2 } from 'lucide-react';
import type { UseMutationResult } from '@tanstack/react-query';

interface NewUser {
  username: string;
  name: string;
  password: string;
  role: 'admin' | 'manager' | 'seller';
}

interface Permissions {
  admin: { canEditProducts: boolean; canViewReports: boolean; canManageUsers: boolean; canSell: boolean; canDiscount: boolean };
  manager: { canEditProducts: boolean; canViewReports: boolean; canManageUsers: boolean; canSell: boolean; canDiscount: boolean };
  seller: { canEditProducts: boolean; canViewReports: boolean; canManageUsers: boolean; canSell: boolean; canDiscount: boolean };
}

interface UsersTabProps {
  // Users tab
  users: any[];
  user: any;
  isAddUserOpen: boolean;
  setIsAddUserOpen: (open: boolean) => void;
  newUser: NewUser;
  setNewUser: React.Dispatch<React.SetStateAction<NewUser>>;
  handleSaveUser: () => void;
  createUserMutation: UseMutationResult<any, Error, any, unknown>;
  editingUser: any;
  setEditingUser: React.Dispatch<React.SetStateAction<any>>;
  isEditOpen: boolean;
  setIsEditOpen: (open: boolean) => void;
  updateUserMutation: UseMutationResult<any, Error, any, unknown>;
  deletingUserId: string | null;
  setDeletingUserId: (id: string | null) => void;
  deleteUserMutation: UseMutationResult<any, Error, any, unknown>;
  // Permissions tab
  permissions: Permissions;
  handlePermissionChange: (role: 'admin' | 'manager' | 'seller', key: string, value: boolean) => void;
}

export function UsersTab({
  users,
  user,
  isAddUserOpen,
  setIsAddUserOpen,
  newUser,
  setNewUser,
  handleSaveUser,
  createUserMutation,
  editingUser,
  setEditingUser,
  isEditOpen,
  setIsEditOpen,
  updateUserMutation,
  deletingUserId,
  setDeletingUserId,
  deleteUserMutation,
  permissions,
  handlePermissionChange,
}: UsersTabProps) {
  return (
    <>
      <TabsContent value="users" className="space-y-4">
        {/* Barra de acções */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">{users.length} utilizador{users.length !== 1 ? 'es' : ''} registado{users.length !== 1 ? 's' : ''}</p>
          </div>
          <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9 gap-2 rounded-xl" disabled={user?.role !== 'admin'} data-testid="button-add-user">
                <UserPlus className="h-4 w-4" />
                Novo Utilizador
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[calc(100%-2rem)] max-h-[90dvh] overflow-y-auto rounded-[2rem] border-none p-0 shadow-2xl sm:max-w-md">
              {/* cabeçalho */}
              <div className="relative overflow-hidden rounded-t-[2rem] bg-[#B71C1C] px-6 py-5">
                <div className="banner-texture" />
                <div className="relative flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
                    <UserPlus className="h-5 w-5 text-white" strokeWidth={2.5} />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-extrabold text-white">Novo Utilizador</DialogTitle>
                    <DialogDescription className="text-[11px] text-white/60">Crie um novo perfil de acesso ao sistema</DialogDescription>
                  </div>
                </div>
              </div>

              {/* corpo */}
              <div className="space-y-4 px-6 py-5">
                {/* avatar preview */}
                <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#B71C1C]/10 text-base font-black text-[#B71C1C]">
                    {newUser.name ? newUser.name.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{newUser.name || 'Nome do utilizador'}</p>
                    <p className="text-[11px] text-gray-400">@{newUser.username || 'username'}</p>
                  </div>
                </div>

                {/* divider */}
                <div className="flex items-center gap-2">
                  <span className="h-4 w-1 rounded-full bg-[#B71C1C]" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Dados de acesso</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Nome completo</Label>
                    <Input
                      placeholder="Ex: João Silva"
                      value={newUser.name}
                      onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                      data-testid="input-user-name"
                      autoComplete="off"
                      className="h-11 rounded-xl border-gray-200 bg-gray-50 focus-visible:border-[#B71C1C]/40 focus-visible:ring-[#B71C1C]/15"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Username</Label>
                    <Input
                      placeholder="joao.silva"
                      value={newUser.username}
                      onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                      data-testid="input-username"
                      autoComplete="off"
                      className="h-11 rounded-xl border-gray-200 bg-gray-50 focus-visible:border-[#B71C1C]/40 focus-visible:ring-[#B71C1C]/15"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Senha inicial</Label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      data-testid="input-password"
                      className="h-11 rounded-xl border-gray-200 bg-gray-50 focus-visible:border-[#B71C1C]/40 focus-visible:ring-[#B71C1C]/15"
                    />
                  </div>
                </div>

                {/* divider função */}
                <div className="flex items-center gap-2">
                  <span className="h-4 w-1 rounded-full bg-[#B71C1C]" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Função &amp; permissões</span>
                </div>

                <div className="flex gap-2">
                  {(['admin', 'manager', 'seller'] as const).map((role) => {
                    const labels = { admin: 'Administrador', manager: 'Gestor', seller: 'Vendedor' };
                    const active = newUser.role === role;
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setNewUser({...newUser, role})}
                        className={`flex-1 rounded-xl border py-2.5 text-[11px] font-bold transition-all ${
                          active
                            ? 'border-[#B71C1C]/30 bg-[#B71C1C] text-white shadow-sm shadow-[#B71C1C]/25'
                            : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {labels[role]}
                      </button>
                    );
                  })}
                </div>
                {/* hidden select para manter data-testid */}
                <select className="sr-only" title="Função do utilizador" value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value as any})} data-testid="select-user-role">
                  <option value="admin">Administrador</option>
                  <option value="manager">Gestor</option>
                  <option value="seller">Vendedor</option>
                </select>
              </div>

              {/* rodapé */}
              <div className="flex items-center justify-end gap-2 border-t border-gray-100 bg-gray-50/60 px-6 py-4 rounded-b-[2rem]">
                <button type="button" onClick={() => setIsAddUserOpen(false)} className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveUser}
                  disabled={createUserMutation.isPending}
                  data-testid="button-save-user"
                  className="rounded-xl bg-gradient-to-r from-[#B71C1C] to-[#7f1d1d] px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-[#B71C1C]/25 hover:opacity-90 disabled:opacity-60"
                >
                  {createUserMutation.isPending ? 'A guardar...' : 'Criar utilizador'}
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="overflow-hidden border border-border/60 shadow-sm">
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="py-3 pl-5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Utilizador</TableHead>
                  <TableHead className="py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Username</TableHead>
                  <TableHead className="py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Grupo</TableHead>
                  <TableHead className="py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Estado</TableHead>
                  <TableHead className="py-3 pr-5 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Acções</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id} className="border-border/50 hover:bg-muted/20" data-testid={`row-user-${u.id}`}>
                    <TableCell className="py-3.5 pl-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20 text-xs font-bold text-primary">
                          {u.avatar ? (
                            <img src={u.avatar} alt="" className="h-full w-full rounded-full object-cover" />
                          ) : (
                            u.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <span className="text-sm font-semibold text-foreground">{u.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5 font-mono text-xs text-muted-foreground">{u.username}</TableCell>
                    <TableCell className="py-3.5">
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
                        u.role === 'admin' ? 'bg-primary/10 text-primary' :
                        u.role === 'manager' ? 'bg-accent/10 text-accent' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {u.role === 'manager' ? 'Gestor' : u.role === 'seller' ? 'Vendedor' : 'Admin'}
                      </span>
                    </TableCell>
                    <TableCell className="py-3.5">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Activo
                      </span>
                    </TableCell>
                    <TableCell className="py-3.5 pr-5 text-right">
                      <Dialog open={isEditOpen && editingUser?.id === u.id} onOpenChange={(open) => { setIsEditOpen(open); if (!open) setEditingUser(null); }}>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setEditingUser({...u}); setIsEditOpen(true); }}
                          data-testid={`button-edit-user-${u.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <DialogContent className="w-[calc(100%-2rem)] max-h-[90dvh] overflow-y-auto rounded-[2rem] border-none p-0 shadow-2xl sm:max-w-md">
                          {/* cabeçalho */}
                          <div className="relative overflow-hidden rounded-t-[2rem] bg-[#1A1A2E] px-6 py-5">
                            <div className="banner-texture" />
                            <div className="relative flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
                                <Edit className="h-5 w-5 text-white" strokeWidth={2.5} />
                              </div>
                              <div>
                                <DialogTitle className="text-base font-extrabold text-white">Editar Utilizador</DialogTitle>
                                <DialogDescription className="text-[11px] text-white/50">{editingUser?.name}</DialogDescription>
                              </div>
                            </div>
                          </div>

                          {editingUser && (
                            <div className="space-y-4 px-6 py-5">
                              {/* avatar */}
                              <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1A1A2E]/10 text-base font-black text-[#1A1A2E]">
                                  {editingUser.name?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-gray-800">{editingUser.name}</p>
                                  <p className="text-[11px] text-gray-400">@{editingUser.username}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="h-4 w-1 rounded-full bg-[#1A1A2E]" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Dados de acesso</span>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2 space-y-1.5">
                                  <Label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Nome completo</Label>
                                  <Input
                                    value={editingUser.name}
                                    onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                                    data-testid="input-edit-name"
                                    className="h-11 rounded-xl border-gray-200 bg-gray-50 focus-visible:border-[#1A1A2E]/30 focus-visible:ring-[#1A1A2E]/10"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Username</Label>
                                  <Input
                                    value={editingUser.username}
                                    onChange={(e) => setEditingUser({...editingUser, username: e.target.value})}
                                    data-testid="input-edit-username"
                                    className="h-11 rounded-xl border-gray-200 bg-gray-50 focus-visible:border-[#1A1A2E]/30 focus-visible:ring-[#1A1A2E]/10"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Nova senha</Label>
                                  <Input
                                    type="password"
                                    placeholder="deixe vazio p/ manter"
                                    onChange={(e) => setEditingUser({...editingUser, password: e.target.value})}
                                    data-testid="input-edit-password"
                                    className="h-11 rounded-xl border-gray-200 bg-gray-50 focus-visible:border-[#1A1A2E]/30 focus-visible:ring-[#1A1A2E]/10"
                                  />
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="h-4 w-1 rounded-full bg-[#1A1A2E]" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Função</span>
                              </div>
                              <div className="flex gap-2">
                                {(['admin', 'manager', 'seller'] as const).map((role) => {
                                  const labels = { admin: 'Admin', manager: 'Gestor', seller: 'Vendedor' };
                                  const active = editingUser.role === role;
                                  return (
                                    <button
                                      key={role}
                                      type="button"
                                      onClick={() => setEditingUser({...editingUser, role})}
                                      className={`flex-1 rounded-xl border py-2.5 text-[11px] font-bold transition-all ${
                                        active
                                          ? 'border-[#1A1A2E]/30 bg-[#1A1A2E] text-white'
                                          : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100'
                                      }`}
                                    >
                                      {labels[role]}
                                    </button>
                                  );
                                })}
                              </div>
                              <select className="sr-only" title="Função do utilizador" value={editingUser.role} onChange={(e) => setEditingUser({...editingUser, role: e.target.value})} data-testid="select-edit-role">
                                <option value="admin">Administrador</option>
                                <option value="manager">Gestor</option>
                                <option value="seller">Vendedor</option>
                              </select>
                            </div>
                          )}

                          <div className="flex items-center justify-end gap-2 border-t border-gray-100 bg-gray-50/60 px-6 py-4 rounded-b-[2rem]">
                            <button type="button" onClick={() => setIsEditOpen(false)} className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => updateUserMutation.mutate({ id: editingUser!.id, data: editingUser! })}
                              disabled={updateUserMutation.isPending}
                              data-testid="button-save-edit-user"
                              className="rounded-xl bg-[#1A1A2E] px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                            >
                              {updateUserMutation.isPending ? 'A guardar...' : 'Guardar alterações'}
                            </button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Dialog open={deletingUserId === u.id} onOpenChange={(open) => { if (!open) setDeletingUserId(null); }}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeletingUserId(u.id)}
                          data-testid={`button-delete-user-${u.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <DialogContent className="w-[calc(100%-2rem)] rounded-[2rem] border-none p-0 shadow-2xl sm:max-w-sm">
                          <div className="px-6 pt-6 pb-5 text-center">
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 border border-red-100">
                              <Trash2 className="h-6 w-6 text-red-600" strokeWidth={2} />
                            </div>
                            <DialogTitle className="text-base font-bold text-gray-900">Eliminar utilizador</DialogTitle>
                            <DialogDescription className="mt-1.5 text-sm text-gray-500">
                              Tem a certeza que pretende eliminar <span className="font-semibold text-gray-800">"{u.name}"</span>? Esta acção não pode ser desfeita.
                            </DialogDescription>
                          </div>
                          <div className="flex gap-2 border-t border-gray-100 bg-gray-50/60 px-6 py-4 rounded-b-[2rem]">
                            <button type="button" onClick={() => setDeletingUserId(null)} className="flex-1 rounded-xl border border-gray-200 bg-white py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteUserMutation.mutate(u.id)}
                              disabled={deleteUserMutation.isPending}
                              data-testid="button-confirm-delete-user"
                              className="flex-1 rounded-xl bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                            >
                              {deleteUserMutation.isPending ? 'A eliminar...' : 'Eliminar'}
                            </button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="permissions" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Controle de Acesso por Grupo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-6 px-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Permissão</TableHead>
                    <TableHead className="text-center">Administrador</TableHead>
                    <TableHead className="text-center">Gestor</TableHead>
                    <TableHead className="text-center">Vendedor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Editar Produtos</TableCell>
                    <TableCell className="text-center"><Checkbox checked={permissions.admin.canEditProducts} onCheckedChange={(c) => handlePermissionChange('admin', 'canEditProducts', !!c)} /></TableCell>
                    <TableCell className="text-center"><Checkbox checked={permissions.manager.canEditProducts} onCheckedChange={(c) => handlePermissionChange('manager', 'canEditProducts', !!c)} /></TableCell>
                    <TableCell className="text-center"><Checkbox checked={permissions.seller.canEditProducts} onCheckedChange={(c) => handlePermissionChange('seller', 'canEditProducts', !!c)} /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Ver Relatórios Financeiros</TableCell>
                    <TableCell className="text-center"><Checkbox checked={permissions.admin.canViewReports} onCheckedChange={(c) => handlePermissionChange('admin', 'canViewReports', !!c)} /></TableCell>
                    <TableCell className="text-center"><Checkbox checked={permissions.manager.canViewReports} onCheckedChange={(c) => handlePermissionChange('manager', 'canViewReports', !!c)} /></TableCell>
                    <TableCell className="text-center"><Checkbox checked={permissions.seller.canViewReports} onCheckedChange={(c) => handlePermissionChange('seller', 'canViewReports', !!c)} /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Gerenciar Usuários</TableCell>
                    <TableCell className="text-center"><Checkbox checked={permissions.admin.canManageUsers} onCheckedChange={(c) => handlePermissionChange('admin', 'canManageUsers', !!c)} /></TableCell>
                    <TableCell className="text-center"><Checkbox checked={permissions.manager.canManageUsers} onCheckedChange={(c) => handlePermissionChange('manager', 'canManageUsers', !!c)} /></TableCell>
                    <TableCell className="text-center"><Checkbox checked={permissions.seller.canManageUsers} onCheckedChange={(c) => handlePermissionChange('seller', 'canManageUsers', !!c)} /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Aplicar Descontos no PDV</TableCell>
                    <TableCell className="text-center"><Checkbox checked={permissions.admin.canDiscount} onCheckedChange={(c) => handlePermissionChange('admin', 'canDiscount', !!c)} /></TableCell>
                    <TableCell className="text-center"><Checkbox checked={permissions.manager.canDiscount} onCheckedChange={(c) => handlePermissionChange('manager', 'canDiscount', !!c)} /></TableCell>
                    <TableCell className="text-center"><Checkbox checked={permissions.seller.canDiscount} onCheckedChange={(c) => handlePermissionChange('seller', 'canDiscount', !!c)} /></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </>
  );
}
