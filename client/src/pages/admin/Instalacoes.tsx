import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Wrench, ChevronRight, Filter, Loader2, CheckCircle2, Clock, PlayCircle, ClipboardList } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const STATUS_LABELS: Record<string, string> = {
  ORCAMENTO: "Levantamento", PENDENTE: "Pendente", EM_ANDAMENTO: "Em Andamento", CONCLUIDA: "Concluída", CANCELADA: "Cancelada",
};
const TIPO_LABELS: Record<string, string> = { ALARME: "Alarme", CAMERA: "Câmera", CERCA: "Cerca" };

const STATUS_CLASSES: Record<string, string> = {
  ORCAMENTO: "badge-orcamento", PENDENTE: "badge-pendente", EM_ANDAMENTO: "badge-em-andamento",
  CONCLUIDA: "badge-concluida", CANCELADA: "badge-cancelada",
};
const TIPO_MULTIPLO_LABEL = "Múltiplo (Combo)";

export default function AdminInstalacoes() {
  const [, navigate] = useLocation();
  const [filtroStatus, setFiltroStatus] = useState("TODOS");
  const [filtroTipo, setFiltroTipo] = useState("TODOS_TIPOS");
  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState({
    clienteId: "", clienteProvisorio: "", tipo: "ALARME" as "ALARME" | "CAMERA" | "CERCA" | "MULTIPLO",
    funcionarioId: "", tecnicosIds: [] as number[], enderecoExecucao: "", dataPrevista: "", observacoes: "",
  });
  const [isProvisorio, setIsProvisorio] = useState(false);


  const { data: instalacoes, isLoading, refetch } = trpc.instalacoes.listar.useQuery({
    status: (filtroStatus === "TODOS" || !filtroStatus) ? undefined : filtroStatus as any,
    tipo: (filtroTipo === "TODOS_TIPOS" || !filtroTipo) ? undefined : filtroTipo,
  });

  const { data: clientes } = trpc.clientes.listar.useQuery({});
  const { data: funcionarios } = trpc.funcionarios.listar.useQuery();
  const utils = trpc.useUtils();

  const criarMutation = trpc.instalacoes.criar.useMutation({
    onSuccess: () => {
      toast.success("Instalação criada com sucesso!");
      setModalAberto(false);
      setForm({ clienteId: "", clienteProvisorio: "", tipo: "ALARME", funcionarioId: "", tecnicosIds: [], enderecoExecucao: "", dataPrevista: "", observacoes: "" });
      setIsProvisorio(false);
      utils.instalacoes.listar.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });



  const handleCriar = () => {
    if (!isProvisorio && !form.clienteId) { toast.error("Selecione um cliente."); return; }
    if (isProvisorio && !form.clienteProvisorio) { toast.error("Digite o nome do cliente."); return; }
    criarMutation.mutate({
      clienteId: isProvisorio ? null : parseInt(form.clienteId),
      clienteProvisorio: isProvisorio ? form.clienteProvisorio : null,
      tipo: form.tipo,
      funcionarioId: form.funcionarioId && form.funcionarioId !== "NENHUM" ? parseInt(form.funcionarioId) : null,
      tecnicosIds: form.tecnicosIds,
      enderecoExecucao: form.enderecoExecucao || null,
      dataPrevista: form.dataPrevista || null,
      observacoes: form.observacoes || null,
    });
  };

  const toggleTecnico = (id: number) => {
    setForm(f => ({
      ...f,
      tecnicosIds: f.tecnicosIds.includes(id)
        ? f.tecnicosIds.filter(tid => tid !== id)
        : [...f.tecnicosIds, id]
    }));
  };

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">Instalações</h1>
            <p className="text-sm text-muted-foreground">{instalacoes?.length ?? 0} OS encontrada(s)</p>
          </div>
          <Button className="gap-2 w-full sm:w-auto" onClick={() => setModalAberto(true)}>
            <Plus className="w-4 h-4" /> Nova Instalação
          </Button>
        </div>

        <div className="flex flex-col gap-4">
          <Tabs value={filtroStatus} onValueChange={setFiltroStatus} className="w-full">
            <TabsList className="grid grid-cols-3 sm:grid-cols-5 w-full max-w-3xl bg-muted/30 h-auto p-1">
              <TabsTrigger value="TODOS" className="text-[10px] sm:text-xs py-1.5 px-2">Todas</TabsTrigger>
              <TabsTrigger value="ORCAMENTO" className="text-[10px] sm:text-xs py-1.5 px-2 gap-1">
                <ClipboardList className="w-3 h-3" /> <span className="hidden sm:inline">Levantamentos</span><span className="sm:hidden">Orç.</span>
              </TabsTrigger>
              <TabsTrigger value="PENDENTE" className="text-[10px] sm:text-xs py-1.5 px-2 gap-1">
                <Clock className="w-3 h-3" /> <span className="hidden sm:inline">Prontas</span><span className="sm:hidden">Prontas</span>
              </TabsTrigger>
              <TabsTrigger value="EM_ANDAMENTO" className="text-[10px] sm:text-xs py-1.5 px-2 gap-1">
                <PlayCircle className="w-3 h-3" /> <span className="hidden sm:inline">Em curso</span><span className="sm:hidden">Exec.</span>
              </TabsTrigger>
              <TabsTrigger value="CONCLUIDA" className="text-[10px] sm:text-xs py-1.5 px-2 gap-1">
                <CheckCircle2 className="w-3 h-3" /> <span className="hidden sm:inline">Concluídas</span><span className="sm:hidden">Concl.</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-2">
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="w-44 bg-input border-border text-sm h-9">
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                  <SelectValue placeholder="Todos os tipos" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS_TIPOS">Todos os tipos</SelectItem>
                {Object.entries(TIPO_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                <SelectItem value="MULTIPLO">{TIPO_MULTIPLO_LABEL}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl bg-card border border-border animate-pulse" />)}
          </div>
        ) : instalacoes?.length === 0 ? (
          <Card className="border-border">
            <CardContent className="py-12 text-center">
              <Wrench className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhuma instalação encontrada.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {instalacoes?.map((item) => (
              <Link key={item.instalacao.id} href={`/admin/instalacoes/${item.instalacao.id}`}>
                <a className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-muted/20 transition-all">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Wrench className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-foreground">
                        #{String(item.instalacao.id).padStart(5, "0")} — {item.clienteNome}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLASSES[item.instalacao.status]}`}>
                        {STATUS_LABELS[item.instalacao.status]}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-xs text-muted-foreground">{item.instalacao.tipo === "MULTIPLO" ? TIPO_MULTIPLO_LABEL : TIPO_LABELS[item.instalacao.tipo]}</span>
                      {item.funcionarioNome && (
                        <span className="text-xs text-muted-foreground">· {item.funcionarioNome}</span>
                      )}
                      {item.instalacao.dataPrevista && (
                        <span className="text-xs text-muted-foreground">
                          · Prevista: {new Date(item.instalacao.dataPrevista).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </a>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Modal nova instalação */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Instalação</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <Label className="text-xs text-muted-foreground">Cliente *</Label>
                <button
                  type="button"
                  className="text-[10px] text-primary hover:underline"
                  onClick={() => setIsProvisorio(!isProvisorio)}
                >
                  {isProvisorio ? "Selecionar cadastrado" : "Cliente não cadastrado?"}
                </button>
              </div>
              {isProvisorio ? (
                <Input
                  placeholder="Nome do cliente provisório"
                  value={form.clienteProvisorio}
                  onChange={(e) => setForm((f) => ({ ...f, clienteProvisorio: e.target.value }))}
                  className="h-9 bg-input border-border"
                />
              ) : (
                <Select value={form.clienteId} onValueChange={(v) => {
                  const cliente = clientes?.find(c => String(c.id) === v);
                  let endereco = "";
                  if (cliente) {
                    endereco = [
                      cliente.rua,
                      cliente.numero,
                      cliente.bairro,
                      cliente.cidade,
                      cliente.uf
                    ].filter(Boolean).join(", ");
                  }
                  setForm((f) => ({ ...f, clienteId: v, enderecoExecucao: endereco }));
                }}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Selecionar cliente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes?.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.nomeRazao}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1">Tipo de Serviço</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm((f) => ({ ...f, tipo: v as any }))}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALARME">Alarme</SelectItem>
                    <SelectItem value="CAMERA">Câmera</SelectItem>
                    <SelectItem value="CERCA">Cerca Elétrica</SelectItem>
                    <SelectItem value="MULTIPLO">{TIPO_MULTIPLO_LABEL}</SelectItem>
                  </SelectContent>
                </Select>


              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Técnicos que verão esta OS *</Label>
                <div className="grid grid-cols-2 gap-2 p-3 rounded-lg border border-border bg-muted/20">
                  {funcionarios?.filter(f => f.ativo && f.perfil !== "ADMIN").map(f => (
                    <label key={f.id} className="flex items-center gap-2 cursor-pointer group">
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${form.tecnicosIds.includes(f.id) ? 'bg-primary border-primary' : 'border-border bg-input group-hover:border-primary/50'}`}
                        onClick={() => toggleTecnico(f.id)}
                      >
                        {form.tecnicosIds.includes(f.id) && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-xs text-foreground truncate">{f.nome}</span>
                    </label>
                  ))}
                  {(!funcionarios || funcionarios.filter(f => f.ativo && f.perfil !== "ADMIN").length === 0) && (
                    <p className="text-[10px] text-muted-foreground italic col-span-2">Nenhum técnico cadastrado.</p>
                  )}
                </div>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1">Endereço de Execução</Label>
              <Input
                value={form.enderecoExecucao}
                onChange={(e) => setForm((f) => ({ ...f, enderecoExecucao: e.target.value }))}
                className="bg-input border-border"
                placeholder="Endereço onde será realizada a instalação"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1">Data Prevista</Label>
              <Input
                type="date"
                value={form.dataPrevista}
                onChange={(e) => setForm((f) => ({ ...f, dataPrevista: e.target.value }))}
                className="bg-input border-border"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1">Observações</Label>
              <Textarea
                value={form.observacoes}
                onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))}
                className="bg-input border-border resize-none"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAberto(false)}>Cancelar</Button>
            <Button onClick={handleCriar} disabled={criarMutation.isPending} className="gap-2">
              {criarMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Criar Instalação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
