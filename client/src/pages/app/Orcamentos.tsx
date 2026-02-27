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
import { ClipboardList, Plus, Package, MapPin, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

const TIPO_LABELS: Record<string, string> = {
    ALARME: "Alarme",
    CAMERA: "Câmera",
    CERCA: "Cerca",
    MULTIPLO: "Combo"
};

export default function AppOrcamentos() {
    const [, navigate] = useLocation();
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
    const { data: orcamentos, isLoading } = trpc.instalacoes.minhasInstalacoes.useQuery({
        status: "ORCAMENTO",
    });

    const { data: clientes } = trpc.clientes.listarParaLevantamento.useQuery();

    const criarLevantamentoMutation = trpc.instalacoes.criarLevantamento.useMutation({
        onSuccess: () => {
            toast.success("Orçamento criado com sucesso! O admin já pode visualizar.");
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
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-foreground">Meus Orçamentos</h1>
                        <p className="text-sm text-muted-foreground">{orcamentos?.length ?? 0} levantamento(s) pendente(s)</p>
                    </div>
                    <Button size="sm" className="gap-2" onClick={() => setModalAberto(true)}>
                        <Plus className="w-4 h-4" /> Novo Orçamento
                    </Button>
                </div>

                {isLoading ? (
                    <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-24 rounded-xl bg-card border border-border animate-pulse" />
                        ))}
                    </div>
                ) : orcamentos?.length === 0 ? (
                    <Card className="border-border">
                        <CardContent className="py-12 text-center">
                            <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-20" />
                            <p className="text-muted-foreground">Nenhum orçamento em andamento.</p>
                            <Button variant="link" onClick={() => setModalAberto(true)}>Clique aqui para criar um novo</Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {orcamentos?.map((item) => (
                            <Link key={item.instalacao.id} href={`/app/instalacoes/${item.instalacao.id}`}>
                                <a className="block p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-muted/20 transition-all">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-primary/10 text-primary uppercase">
                                            {TIPO_LABELS[item.instalacao.tipo]}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">
                                            {new Date(item.instalacao.criadoEm!).toLocaleDateString("pt-BR")}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-foreground mb-1 leading-tight">
                                        {item.clienteNome}
                                    </h3>
                                    {item.instalacao.enderecoExecucao && (
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <MapPin className="w-3.5 h-3.5" />
                                            <span className="truncate">{item.instalacao.enderecoExecucao}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
                                        <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
                                            <Package className="w-3.5 h-3.5" />
                                            Materiais e Detalhes
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                </a>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Novo Orçamento */}
            <Dialog open={modalAberto} onOpenChange={setModalAberto}>
                <DialogContent className="bg-card border-border max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Novo Levantamento Técnico</DialogTitle>
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
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" size="sm" onClick={() => setModalAberto(false)}>Cancelar</Button>
                        <Button size="sm" onClick={handleCriar} disabled={criarLevantamentoMutation.isPending}>
                            {criarLevantamentoMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Criar Orçamento
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
