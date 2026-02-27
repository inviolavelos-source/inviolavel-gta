import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Users, Phone, Mail, Shield, User, Key, Power, Loader2, Trash2 } from "lucide-react";

export default function AdminFuncionarios() {
  const [modalAberto, setModalAberto] = useState(false);
  const [senhaModal, setSenhaModal] = useState<{ id: number; nome: string } | null>(null);
  const [novaSenha, setNovaSenha] = useState("");

  const [form, setForm] = useState({
    nome: "", email: "", senha: "", perfil: "FUNCIONARIO" as "ADMIN" | "FUNCIONARIO",
    telefone: "", cargo: "",
  });

  const { data: funcionarios, isLoading, refetch } = trpc.funcionarios.listar.useQuery();
  const utils = trpc.useUtils();

  const criarMutation = trpc.funcionarios.criar.useMutation({
    onSuccess: () => {
      toast.success("Funcionário criado com sucesso!");
      setModalAberto(false);
      setForm({ nome: "", email: "", senha: "", perfil: "FUNCIONARIO", telefone: "", cargo: "" });
      utils.funcionarios.listar.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const alterarStatusMutation = trpc.funcionarios.alterarStatus.useMutation({
    onSuccess: () => { toast.success("Status atualizado!"); utils.funcionarios.listar.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  const resetarSenhaMutation = trpc.funcionarios.resetarSenha.useMutation({
    onSuccess: () => { toast.success("Senha redefinida!"); setSenhaModal(null); setNovaSenha(""); },
    onError: (err) => toast.error(err.message),
  });

  const excluirMutation = trpc.funcionarios.excluir.useMutation({
    onSuccess: () => {
      toast.success("Funcionário excluído!");
      utils.funcionarios.listar.invalidate();
    },
    onError: (err) => toast.error("Erro ao excluir: " + err.message),
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">Funcionários</h1>
            <p className="text-sm text-muted-foreground">{funcionarios?.length ?? 0} funcionário(s)</p>
          </div>
          <Button className="gap-2 w-full sm:w-auto" onClick={() => setModalAberto(true)}>
            <Plus className="w-4 h-4" /> Novo Funcionário
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl bg-card border border-border animate-pulse" />)}
          </div>
        ) : funcionarios?.length === 0 ? (
          <Card className="border-border">
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum funcionário cadastrado.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {funcionarios?.map((func) => (
              <Card key={func.id} className={`border-border ${!func.ativo ? "opacity-60" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${func.perfil === "ADMIN" ? "bg-primary/20" : "bg-muted"}`}>
                      {func.perfil === "ADMIN" ? <Shield className="w-5 h-5 text-primary" /> : <User className="w-5 h-5 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-foreground">{func.nome}</p>
                        <Badge variant={func.perfil === "ADMIN" ? "default" : "secondary"} className="text-xs">
                          {func.perfil === "ADMIN" ? "Admin" : "Funcionário"}
                        </Badge>
                        {!func.ativo && <Badge variant="destructive" className="text-xs">Inativo</Badge>}
                      </div>
                      <div className="flex flex-wrap gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="w-3 h-3" /> {func.email}
                        </span>
                        {func.telefone && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="w-3 h-3" /> {func.telefone}
                          </span>
                        )}
                        {func.cargo && <span className="text-xs text-muted-foreground">{func.cargo}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 text-muted-foreground hover:text-foreground"
                        title="Redefinir senha"
                        onClick={() => setSenhaModal({ id: func.id, nome: func.nome ?? "" })}
                      >
                        <Key className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`w-8 h-8 ${func.ativo ? "text-red-400 hover:text-red-300" : "text-green-400 hover:text-green-300"}`}
                        title={func.ativo ? "Desativar" : "Ativar"}
                        onClick={() => alterarStatusMutation.mutate({ id: func.id, ativo: !func.ativo })}
                      >
                        <Power className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 text-muted-foreground hover:text-red-400"
                        title="Excluir"
                        onClick={() => {
                          if (confirm(`Tem certeza que deseja excluir permanetemente o funcionário ${func.nome}? Esta ação não pode ser desfeita.`)) {
                            excluirMutation.mutate({ id: func.id });
                          }
                        }}
                        disabled={excluirMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal criar funcionário */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Funcionário</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs text-muted-foreground mb-1">Nome Completo *</Label>
              <Input value={form.nome} onChange={set("nome")} className="bg-input border-border" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1">E-mail *</Label>
              <Input type="email" value={form.email} onChange={set("email")} className="bg-input border-border" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1">Senha *</Label>
              <Input type="password" value={form.senha} onChange={set("senha")} className="bg-input border-border" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1">Perfil</Label>
                <Select value={form.perfil} onValueChange={(v) => setForm((f) => ({ ...f, perfil: v as any }))}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FUNCIONARIO">Funcionário</SelectItem>
                    <SelectItem value="ADMIN">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1">Cargo</Label>
                <Input value={form.cargo} onChange={set("cargo")} className="bg-input border-border" placeholder="Ex: Técnico" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1">Telefone</Label>
              <Input value={form.telefone} onChange={set("telefone")} className="bg-input border-border" placeholder="(00) 00000-0000" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAberto(false)}>Cancelar</Button>
            <Button
              onClick={() => criarMutation.mutate({ nome: form.nome, email: form.email, senha: form.senha, perfil: form.perfil, telefone: form.telefone || undefined, cargo: form.cargo || undefined })}
              disabled={criarMutation.isPending}
              className="gap-2"
            >
              {criarMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Criar Funcionário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal redefinir senha */}
      <Dialog open={!!senhaModal} onOpenChange={() => { setSenhaModal(null); setNovaSenha(""); }}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle>Redefinir Senha</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Redefinir senha de: <strong className="text-foreground">{senhaModal?.nome}</strong></p>
          <div>
            <Label className="text-xs text-muted-foreground mb-1">Nova Senha</Label>
            <Input
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              className="bg-input border-border"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSenhaModal(null); setNovaSenha(""); }}>Cancelar</Button>
            <Button
              onClick={() => senhaModal && resetarSenhaMutation.mutate({ id: senhaModal.id, novaSenha })}
              disabled={resetarSenhaMutation.isPending || novaSenha.length < 6}
              className="gap-2"
            >
              {resetarSenhaMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Redefinir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
