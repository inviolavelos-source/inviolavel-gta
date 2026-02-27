import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wrench, ChevronRight, AlertCircle, Plus, ClipboardList, Clock, PlayCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const STATUS_LABELS: Record<string, string> = {
  ORCAMENTO: "Levantamento",
  PENDENTE: "Pendente",
  EM_ANDAMENTO: "Em Andamento",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
};

const STATUS_CLASSES: Record<string, string> = {
  ORCAMENTO: "badge-orcamento",
  PENDENTE: "badge-pendente",
  EM_ANDAMENTO: "badge-em-andamento",
  CONCLUIDA: "badge-concluida",
  CANCELADA: "badge-cancelada",
};

const TIPO_LABELS: Record<string, string> = {
  ALARME: "Alarme",
  CAMERA: "Câmera",
  CERCA: "Cerca",
  MULTIPLO: "Combo"
};

export default function AppInstalacoes() {
  const [, navigate] = useLocation();
  const [filtroStatus, setFiltroStatus] = useState("PENDENTE");
  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState({
    clienteId: "",
    clienteProvisorio: "",
    tipo: "ALARME" as "ALARME" | "CAMERA" | "CERCA" | "MULTIPLO",
    enderecoExecucao: "",
    observacoes: "",
  });
  const [isProvisorio, setIsProvisorio] = useState(false);

  const utils = trpc.useUtils();
  const { data: instalacoes, isLoading } = trpc.instalacoes.minhasInstalacoes.useQuery({
    status: (filtroStatus === "TODOS" || !filtroStatus) ? undefined : filtroStatus,
  });

  const { data: clientes } = trpc.clientes.listarParaLevantamento.useQuery();

  const criarLevantamentoMutation = trpc.instalacoes.criarLevantamento.useMutation({
    onSuccess: () => {
      toast.success("Levantamento criado com sucesso! O admin já pode visualizar.");
      setModalAberto(false);
      setForm({ clienteId: "", clienteProvisorio: "", tipo: "ALARME", enderecoExecucao: "", observacoes: "" });
      setIsProvisorio(false);
      utils.instalacoes.minhasInstalacoes.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleCriar = () => {
    if (!isProvisorio && !form.clienteId) {
      toast.error("Selecione um cliente.");
      return;
    }
    if (isProvisorio && !form.clienteProvisorio) {
      toast.error("Digite o nome do cliente.");
      return;
    }
    criarLevantamentoMutation.mutate({
      clienteId: isProvisorio ? null : parseInt(form.clienteId),
      clienteProvisorio: isProvisorio ? form.clienteProvisorio : null,
      tipo: form.tipo,
      enderecoExecucao: form.enderecoExecucao || null,
      observacoes: form.observacoes || null,
    });
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">Instalação</h1>
              <p className="text-sm text-muted-foreground">{instalacoes?.length ?? 0} registro(s) encontrado(s)</p>
            </div>
          </div>

          <Tabs value={filtroStatus} onValueChange={setFiltroStatus} className="w-full">
            <TabsList className="grid grid-cols-3 w-full bg-muted/30 h-auto p-1">
              <TabsTrigger value="PENDENTE" className="text-[10px] sm:text-xs py-1.5 px-2 gap-1 text-orange-400">
                <Clock className="w-3 h-3" /> Pendentes
              </TabsTrigger>
              <TabsTrigger value="EM_ANDAMENTO" className="text-[10px] sm:text-xs py-1.5 px-2 gap-1 text-blue-400">
                <PlayCircle className="w-3 h-3" /> Em Curso
              </TabsTrigger>
              <TabsTrigger value="CONCLUIDA" className="text-[10px] sm:text-xs py-1.5 px-2 gap-1 text-green-400">
                <CheckCircle className="w-3 h-3" /> Finalizadas
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-card border border-border animate-pulse" />
            ))}
          </div>
        ) : instalacoes?.length === 0 ? (
          <Card className="border-border">
            <CardContent className="py-12 text-center">
              <Wrench className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum registro encontrado.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {instalacoes?.map((item) => (
              <Link key={item.instalacao.id} href={`/app/instalacoes/${item.instalacao.id}`}>
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
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-muted-foreground">{TIPO_LABELS[item.instalacao.tipo]}</span>
                      {item.instalacao.dataPrevista && (
                        <span className="text-xs text-muted-foreground">
                          · {new Date(item.instalacao.dataPrevista).toLocaleDateString("pt-BR")}
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

      {/* Modal Novo Levantamento */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle>Novo Orçamento Prévio</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
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
              <Select value={form.clienteId} onValueChange={(v) => setForm((f) => ({ ...f, clienteId: v }))}>
                <SelectTrigger className="h-9 bg-input border-border">
                  <SelectValue placeholder="Selecionar cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {clientes?.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.nomeRazao}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div>
              <Label className="text-xs text-muted-foreground mb-1">Tipo de Serviço</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm((f) => ({ ...f, tipo: v as any }))}>
                <SelectTrigger className="h-9 bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALARME">Alarme</SelectItem>
                  <SelectItem value="CAMERA">Câmera</SelectItem>
                  <SelectItem value="CERCA">Cerca Elétrica</SelectItem>
                  <SelectItem value="MULTIPLO">Combo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1">Local da Instalação (Endereço)</Label>
              <Input
                value={form.enderecoExecucao}
                onChange={(e) => setForm((f) => ({ ...f, enderecoExecucao: e.target.value }))}
                className="h-9 bg-input border-border"
                placeholder="Ex: Fazenda Santa Maria"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1">Observações / Levantamento</Label>
              <Textarea
                value={form.observacoes}
                onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))}
                className="bg-input border-border resize-none"
                placeholder="Descreva o que será necessário..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setModalAberto(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleCriar} disabled={criarLevantamentoMutation.isPending}>
              {criarLevantamentoMutation.isPending ? "Criando..." : "Criar Orçamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
