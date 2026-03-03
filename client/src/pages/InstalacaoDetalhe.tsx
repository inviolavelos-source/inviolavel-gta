import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, CheckCircle, Package, MapPin, Calendar, User, Loader2, List, Users, Save, FileText, PlayCircle, Camera, Image as ImageIcon, X, Edit3, Map as MapIcon, Download } from "lucide-react";
import { getGeolocation } from "@/lib/geo";
import SignaturePad from "@/components/SignaturePad";
import { Checkbox } from "@/components/ui/checkbox";

const STATUS_LABELS: Record<string, string> = {
  ORCAMENTO: "Levantamento", PENDENTE: "Pendente", EM_ANDAMENTO: "Em Andamento", CONCLUIDA: "Concluída", CANCELADA: "Cancelada",
};
const STATUS_CLASSES: Record<string, string> = {
  ORCAMENTO: "badge-orcamento", PENDENTE: "badge-pendente", EM_ANDAMENTO: "badge-em-andamento",
  CONCLUIDA: "badge-concluida", CANCELADA: "badge-cancelada",
};
const TIPO_LABELS: Record<string, string> = { ALARME: "Alarme", CAMERA: "Câmera", CERCA: "Cerca", MULTIPLO: "Múltiplo" };

const CHECKLIST_ITEMS: Record<string, string[]> = {
  ALARME: ["Configurou App Mobile?", "Testou Sensores de Porta?", "Testou Sensores de Presença?", "Bateria testada?", "Sirene testada?"],
  CAMERA: ["Foco e ângulo ajustados?", "Acesso remoto configurado?", "Gravação verificada?", "Lentes limpas?", "Conectores isolados?"],
  CERCA: ["Tensão da cerca medida?", "Hastes bem fixadas?", "Alerta sonoro testado?", "Repuxos ajustados?", "Aterramento verificado?"],
  MULTIPLO: ["Sensores testados?", "Cameras configuradas?", "Cerca tensionada?", "App funcionando?", "Local limpo?"],
};

export default function InstalacaoDetalhe() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { isAdmin } = useAuth();
  const instalacaoId = parseInt(params.id);
  const [modalMaterial, setModalMaterial] = useState(false);
  const [materialForm, setMaterialForm] = useState({ produtoId: "", quantidade: "1", observacoes: "" });

  // Zonas e Usuários
  const [zonas, setZonas] = useState<{ numero: string; local: string }[]>([]);
  const [usuarios, setUsuarios] = useState<{ numero: string; nome: string }[]>([]);

  const [novaZona, setNovaZona] = useState({ numero: "", local: "" });
  const [novoUsuario, setNovoUsuario] = useState({ numero: "", nome: "" });

  const { data, isLoading, refetch } = trpc.instalacoes.buscar.useQuery({ id: instalacaoId });
  const { data: produtos } = trpc.produtos.listar.useQuery({});
  const { data: funcionarios } = trpc.funcionarios.listar.useQuery();
  const utils = trpc.useUtils();

  const [modalEdit, setModalEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    tecnicosIds: [] as number[],
    dataPrevista: "",
    enderecoExecucao: "",
    observacoes: ""
  });

  // Finish flow
  const [modalConcluir, setModalConcluir] = useState(false);
  const [assinatura, setAssinatura] = useState<string | null>(null);
  const [itensChecklist, setItensChecklist] = useState<Record<string, boolean>>({});

  // Fotos
  const { data: fotos } = trpc.instalacoes.listarFotos.useQuery({ instalacaoId });
  const uploadFotoMutation = trpc.instalacoes.uploadFoto.useMutation({
    onSuccess: () => {
      toast.success("Foto enviada!");
      utils.instalacoes.listarFotos.invalidate({ instalacaoId });
    },
    onError: (err) => toast.error(err.message),
  });

  const excluirFotoMutation = trpc.instalacoes.excluirFoto.useMutation({
    onSuccess: () => {
      toast.success("Foto removida!");
      utils.instalacoes.listarFotos.invalidate({ instalacaoId });
    },
    onError: (err) => toast.error(err.message),
  });

  useEffect(() => {
    if (data?.instalacao) {
      if (data.instalacao.zonas) {
        try {
          const z = typeof data.instalacao.zonas === 'string' ? JSON.parse(data.instalacao.zonas) : data.instalacao.zonas;
          setZonas(Array.isArray(z) ? z : []);
        } catch (e) { setZonas([]); }
      }
      if (data.instalacao.usuarios) {
        try {
          const u = typeof data.instalacao.usuarios === 'string' ? JSON.parse(data.instalacao.usuarios) : data.instalacao.usuarios;
          setUsuarios(Array.isArray(u) ? u : []);
        } catch (e) { setUsuarios([]); }
      }
    }
  }, [data]);

  const atualizarMutation = trpc.instalacoes.atualizar.useMutation({
    onSuccess: () => {
      toast.success("Instalação atualizada!");
      setModalEdit(false);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const abrirEdicao = () => {
    if (!data) return;
    setEditForm({
      tecnicosIds: data.tecnicos?.map((t: any) => t.id) || (data.instalacao.funcionarioId ? [data.instalacao.funcionarioId] : []),
      dataPrevista: data.instalacao.dataPrevista || "",
      enderecoExecucao: data.instalacao.enderecoExecucao || "",
      observacoes: data.instalacao.observacoes || ""
    });
    setModalEdit(true);
  };

  const adicionarMutation = trpc.instalacoes.adicionarMaterial.useMutation({
    onSuccess: () => {
      toast.success("Material adicionado!");
      setModalMaterial(false);
      setMaterialForm({ produtoId: "", quantidade: "1", observacoes: "" });
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const removerMutation = trpc.instalacoes.removerMaterial.useMutation({
    onSuccess: () => { toast.success("Material removido!"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const finalizarMutation = trpc.instalacoes.finalizar.useMutation({
    onSuccess: () => {
      toast.success("Instalação finalizada com sucesso!");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const alterarStatusMutation = trpc.instalacoes.alterarStatus.useMutation({
    onSuccess: () => { toast.success("Status atualizado!"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const salvarDadosTecnicosMutation = trpc.instalacoes.atualizarDadosTecnicos.useMutation({
    onSuccess: () => { toast.success("Dados técnicos salvos com sucesso!"); refetch(); },
    onError: (err) => toast.error("Erro ao salvar: " + err.message),
  });

  const gerarFichaMutation = trpc.clientes.gerarFicha.useMutation({
    onSuccess: (data) => {
      toast.success("PDF Gerado com sucesso!");
      window.open(data.arquivoUrl, "_blank");
    },
    onError: (err) => toast.error("Erro ao gerar PDF: " + err.message),
  });

  const subirPlantaMutation = trpc.instalacoes.subirPlanta.useMutation({
    onSuccess: () => {
      toast.success("Planta enviada com sucesso!");
      refetch();
    },
    onError: (err) => toast.error("Erro ao enviar planta: " + err.message),
  });

  const excluirMutation = trpc.instalacoes.excluir.useMutation({
    onSuccess: () => {
      toast.success("Instalação excluída com sucesso!");
      navigate(backUrl);
    },
    onError: (err) => toast.error("Erro ao excluir: " + err.message),
  });

  const adicionarZona = () => {
    if (!novaZona.numero || !novaZona.local) return;
    setZonas([...zonas, { ...novaZona }]);
    setNovaZona({ numero: "", local: "" });
  };

  const removerZona = (index: number) => {
    setZonas(zonas.filter((_, i) => i !== index));
  };

  const adicionarUsuario = () => {
    if (!novoUsuario.numero || !novoUsuario.nome) return;
    setUsuarios([...usuarios, { ...novoUsuario }]);
    setNovoUsuario({ numero: "", nome: "" });
  };

  const removerUsuario = (index: number) => {
    setUsuarios(usuarios.filter((_, i) => i !== index));
  };

  const backUrl = isAdmin ? "/admin/instalacoes" : "/app/instalacoes";

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!data) {
    return (
      <AppLayout>
        <div className="text-center py-20 text-muted-foreground">Instalação não encontrada.</div>
      </AppLayout>
    );
  }

  const { instalacao, clienteNome, funcionarioNome, materiais } = data as any;
  const podeEditar = instalacao.status !== "CONCLUIDA" && instalacao.status !== "CANCELADA";
  const podeEditarDadosTecnicos = podeEditar || isAdmin; // Admin sempre pode editar dados técnicos

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(backUrl)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <h1 className="text-xl font-bold text-foreground">
                  OS #{String(instalacao.id).padStart(5, "0")}
                </h1>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLASSES[instalacao.status]}`}>
                  {STATUS_LABELS[instalacao.status]}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-primary"
                    onClick={abrirEdicao}
                  >
                    <Save className="w-5 h-5" />
                  </Button>
                )}
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8"
                    onClick={() => {
                      if (confirm("Tem certeza que deseja excluir esta instalação permanentemente? Todas as fotos e materiais serão removidos.")) {
                        excluirMutation.mutate({ id: instalacaoId });
                      }
                    }}
                    disabled={excluirMutation.isPending}
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{TIPO_LABELS[instalacao.tipo]} · {clienteNome}</p>
          </div>
        </div>

        {/* Detalhes */}
        <Card className="border-border">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-start gap-2 col-span-2">
                <Users className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Técnicos Atribuídos</p>
                  <p className="text-sm font-medium text-foreground">
                    {data?.tecnicos && data.tecnicos.length > 0
                      ? data.tecnicos.map((t: any) => t.nome).join(", ")
                      : (funcionarioNome ?? "Não atribuído")}
                  </p>
                </div>
              </div>
              {instalacao.dataPrevista && (
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Data Prevista</p>
                    <p className="text-sm font-medium text-foreground">
                      {new Date(instalacao.dataPrevista).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
              )}
              {instalacao.enderecoExecucao && (
                <div className="col-span-2 flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Endereço de Execução</p>
                    <p className="text-sm font-medium text-foreground">{instalacao.enderecoExecucao}</p>
                  </div>
                </div>
              )}
              {instalacao.observacoes && (
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Observações</p>
                  <p className="text-sm text-foreground">{instalacao.observacoes}</p>
                </div>
              )}
              {/* PLANTA BAIXA SECTION */}
              <div className="col-span-2 pt-2 border-t border-border mt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapIcon className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">Planta Baixa</span>
                  </div>
                  {isAdmin && (
                    <Label htmlFor="upload-planta" className="cursor-pointer">
                      <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 pointer-events-none text-primary">
                        <Plus className="w-3 h-3" /> {instalacao.plantaUrl ? "Trocar Planta" : "Subir Planta"}
                      </Button>
                      <input
                        id="upload-planta"
                        type="file"
                        className="hidden"
                        accept="image/*,application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            subirPlantaMutation.mutate({
                              instalacaoId,
                              base64: ev.target?.result as string,
                              nomeArquivo: file.name
                            });
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </Label>
                  )}
                </div>
                {instalacao.plantaUrl ? (
                  <div className="mt-2 p-3 rounded-lg bg-muted/30 border border-primary/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="text-xs font-medium truncate max-w-[150px]">Planta_Disponivel.{instalacao.plantaUrl.split('.').pop()}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[10px] gap-1"
                      onClick={() => window.open(instalacao.plantaUrl, "_blank")}
                    >
                      <Download className="w-3 h-3" /> Abrir / Ver
                    </Button>
                  </div>
                ) : (
                  <p className="text-[10px] text-muted-foreground mt-1 italic">Nenhuma planta disponível para esta OS.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Materiais */}
        <Card className="border-border">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">
              {instalacao.status === "ORCAMENTO" ? "Levantamento de Materiais" : "Materiais Utilizados"}
            </CardTitle>
            {podeEditar && (
              <Button size="sm" variant="outline" className="gap-1 h-8 text-xs" onClick={() => setModalMaterial(true)}>
                <Plus className="w-3 h-3" /> Adicionar
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {!materiais || materiais.length === 0 ? (
              <div className="px-4 py-6 text-center text-muted-foreground text-sm">
                <Package className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                Nenhum material registado.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {materiais.map((m: any) => (
                  <div key={m.material.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{m.produtoNome}</p>
                      <p className="text-xs text-muted-foreground">
                        Qtd: {m.material.quantidade} {m.produtoUnidade} {m.material.observacoes ? ` · ${m.material.observacoes}` : ""}
                      </p>
                    </div>
                    {podeEditar && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7 text-red-400 hover:text-red-300 flex-shrink-0"
                        onClick={() => removerMutation.mutate({ id: m.material.id })}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        {/* Ficha Técnica (Zonas e Usuários) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Zonas */}
          <Card className="border-border">
            <CardHeader className="pb-2 bg-muted/10 border-b border-border">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <List className="w-4 h-4 text-primary" /> Zonas / Setores
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {podeEditarDadosTecnicos && (
                <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-end">
                  <div className="flex gap-2 flex-1">
                    <div className="w-16">
                      <Label className="text-[10px] uppercase text-muted-foreground">Zona</Label>
                      <Input
                        placeholder="01"
                        value={novaZona.numero}
                        onChange={e => setNovaZona({ ...novaZona, numero: e.target.value })}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-[10px] uppercase text-muted-foreground">Localização</Label>
                      <Input
                        placeholder="Ex: Cozinha"
                        value={novaZona.local}
                        onChange={e => setNovaZona({ ...novaZona, local: e.target.value })}
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                  <Button size="sm" type="button" onClick={adicionarZona} className="h-9 w-full sm:w-9 p-0">
                    <Plus className="w-4 h-4" /> <span className="sm:hidden ml-2">Adicionar Zona</span>
                  </Button>
                </div>
              )}

              <div className="space-y-1">
                {zonas.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Nenhuma zona cadastrada</p>
                ) : (
                  zonas.map((z, i) => (
                    <div key={i} className="flex items-center justify-between bg-muted/20 p-2 rounded-md border border-border/50">
                      <div className="text-xs">
                        <span className="font-bold text-primary mr-2">Z{z.numero}</span>
                        <span className="text-foreground">{z.local}</span>
                      </div>
                      {podeEditarDadosTecnicos && (
                        <button onClick={() => removerZona(i)} className="text-red-400 hover:text-red-500">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Usuários */}
          <Card className="border-border">
            <CardHeader className="pb-2 bg-muted/10 border-b border-border">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" /> Usuários Central
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {podeEditarDadosTecnicos && (
                <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-end">
                  <div className="flex gap-2 flex-1">
                    <div className="w-16">
                      <Label className="text-[10px] uppercase text-muted-foreground">User</Label>
                      <Input
                        placeholder="01"
                        value={novoUsuario.numero}
                        onChange={e => setNovoUsuario({ ...novoUsuario, numero: e.target.value })}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-[10px] uppercase text-muted-foreground">Nome</Label>
                      <Input
                        placeholder="Ex: Pedro"
                        value={novoUsuario.nome}
                        onChange={e => setNovoUsuario({ ...novoUsuario, nome: e.target.value })}
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                  <Button size="sm" type="button" onClick={adicionarUsuario} className="h-9 w-full sm:w-9 p-0">
                    <Plus className="w-4 h-4" /> <span className="sm:hidden ml-2">Adicionar Usuário</span>
                  </Button>
                </div>
              )}

              <div className="space-y-1">
                {usuarios.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Nenhum usuário cadastrado</p>
                ) : (
                  usuarios.map((u, i) => (
                    <div key={i} className="flex items-center justify-between bg-muted/20 p-2 rounded-md border border-border/50">
                      <div className="text-xs">
                        <span className="font-bold text-primary mr-2">U{u.numero}</span>
                        <span className="text-foreground">{u.nome}</span>
                      </div>
                      {podeEditarDadosTecnicos && (
                        <button onClick={() => removerUsuario(i)} className="text-red-400 hover:text-red-500">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fotos */}
        <Card className="border-border">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Camera className="w-4 h-4 text-primary" /> Fotos do Serviço
            </CardTitle>
            <div className="flex gap-2">
              <Label htmlFor="upload-antes" className="cursor-pointer">
                <Button variant="outline" size="sm" className="h-8 text-[10px] gap-1 pointer-events-none">
                  <Plus className="w-3 h-3" /> Foto Antes
                </Button>
                <input
                  id="upload-antes"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  capture="environment"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      uploadFotoMutation.mutate({
                        instalacaoId,
                        base64: ev.target?.result as string,
                        tipo: "ANTES"
                      });
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </Label>
              <Label htmlFor="upload-depois" className="cursor-pointer">
                <Button variant="outline" size="sm" className="h-8 text-[10px] gap-1 pointer-events-none">
                  <Plus className="w-3 h-3" /> Foto Depois
                </Button>
                <input
                  id="upload-depois"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  capture="environment"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      uploadFotoMutation.mutate({
                        instalacaoId,
                        base64: ev.target?.result as string,
                        tipo: "DEPOIS"
                      });
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </Label>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {!fotos || fotos.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-4">Nenhuma foto enviada.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {fotos.map((f) => (
                  <div key={f.id} className="relative group rounded-md overflow-hidden bg-muted border border-border aspect-square">
                    <img src={f.arquivoUrl} className="w-full h-full object-cover" alt="Foto OS" />
                    <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-black/50 text-white backdrop-blur-sm">
                      {f.tipo}
                    </div>
                    {podeEditar && (
                      <button
                        onClick={() => excluirFotoMutation.mutate({ id: f.id })}
                        className="absolute top-1 right-1 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {podeEditarDadosTecnicos && (
          <Button
            variant="secondary"
            className="w-full gap-2 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary"
            onClick={() => salvarDadosTecnicosMutation.mutate({ id: instalacaoId, zonas, usuarios })}
            disabled={salvarDadosTecnicosMutation.isPending}
          >
            {salvarDadosTecnicosMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar Zonas e Usuários
          </Button>
        )}

        {/* Ações */}
        <div className="space-y-2">
          {isAdmin && (
            <div className="space-y-2">
              {instalacao.status === "ORCAMENTO" && (
                <Button
                  className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => alterarStatusMutation.mutate({ id: instalacaoId, status: "PENDENTE" })}
                  disabled={alterarStatusMutation.isPending}
                >
                  <CheckCircle className="w-4 h-4" /> Aprovar Orçamento (Gerar OS)
                </Button>
              )}

              <div className="grid grid-cols-2 gap-2">
                {instalacao.status === "PENDENTE" && (
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => alterarStatusMutation.mutate({ id: instalacaoId, status: "EM_ANDAMENTO" })}
                    disabled={alterarStatusMutation.isPending}
                  >
                    Iniciar OS
                  </Button>
                )}
                {instalacao.status !== "CONCLUIDA" && instalacao.status !== "CANCELADA" && (
                  <Button
                    variant="outline"
                    className="gap-2 text-red-400 border-red-500/30 hover:bg-red-500/10"
                    onClick={() => alterarStatusMutation.mutate({ id: instalacaoId, status: "CANCELADA" })}
                    disabled={alterarStatusMutation.isPending}
                  >
                    Cancelar OS
                  </Button>
                )}
              </div>
            </div>
          )}

          {!isAdmin && (
            <div className="space-y-2">
              {instalacao.status === "ORCAMENTO" && (
                <Button
                  className="w-full gap-2"
                  onClick={() => toast.success("Levantamento enviado para o administrador!")}
                >
                  <FileText className="w-4 h-4" /> Finalizar Levantamento
                </Button>
              )}
              {instalacao.status === "PENDENTE" && (
                <Button
                  className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={async () => {
                    const gps = await getGeolocation();
                    alterarStatusMutation.mutate({ id: instalacaoId, status: "EM_ANDAMENTO", gps });
                  }}
                  disabled={alterarStatusMutation.isPending}
                >
                  <PlayCircle className="w-4 h-4" /> Iniciar Instalação (Em Curso)
                </Button>
              )}
              {instalacao.status === "EM_ANDAMENTO" && (
                <Button
                  className="w-full gap-2 bg-green-600 hover:bg-green-700"
                  onClick={() => setModalConcluir(true)}
                  disabled={alterarStatusMutation.isPending}
                >
                  <CheckCircle className="w-4 h-4" /> Finalizar Instalação
                </Button>
              )}
            </div>
          )}

          {isAdmin && data.instalacao.clienteId && (
            <Button
              variant="outline"
              className="w-full gap-2 border-primary text-primary hover:bg-primary/10"
              onClick={() => gerarFichaMutation.mutate({ id: data.instalacao.clienteId! })}
              disabled={gerarFichaMutation.isPending}
            >
              {gerarFichaMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              Gerar Ficha de Cadastro PDF (Unificada)
            </Button>
          )}

          {instalacao.finalizadoEm && (
            <p className="text-center text-xs text-muted-foreground">
              Finalizada em: {new Date(instalacao.finalizadoEm).toLocaleString("pt-BR")}
            </p>
          )}
        </div>
      </div>

      {/* Modal adicionar material */}
      < Dialog open={modalMaterial} onOpenChange={setModalMaterial} >
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle>Adicionar Material</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs text-muted-foreground mb-1">Produto *</Label>
              <Select value={materialForm.produtoId} onValueChange={(v) => setMaterialForm((f) => ({ ...f, produtoId: v }))}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="Selecionar produto..." />
                </SelectTrigger>
                <SelectContent>
                  {produtos?.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.nome} ({p.categoria})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1">Quantidade *</Label>
              <Input
                type="number"
                min="1"
                value={materialForm.quantidade}
                onChange={(e) => setMaterialForm((f) => ({ ...f, quantidade: e.target.value }))}
                className="bg-input border-border"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1">Observações</Label>
              <Textarea
                value={materialForm.observacoes}
                onChange={(e) => setMaterialForm((f) => ({ ...f, observacoes: e.target.value }))}
                className="bg-input border-border resize-none"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalMaterial(false)}>Cancelar</Button>
            <Button
              onClick={() => {
                if (!materialForm.produtoId) { toast.error("Selecione um produto."); return; }
                adicionarMutation.mutate({
                  instalacaoId,
                  produtoId: parseInt(materialForm.produtoId),
                  quantidade: parseFloat(materialForm.quantidade) || 1,
                  observacoes: materialForm.observacoes || null,
                });
              }}
              disabled={adicionarMutation.isPending}
              className="gap-2"
            >
              {adicionarMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog >
      {/* Modal Editar OS (Admin) */}
      <Dialog open={modalEdit} onOpenChange={setModalEdit}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle>Editar Ordens de Serviço</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Técnicos Designados</Label>
              <div className="grid grid-cols-1 gap-1 p-2 rounded-lg border border-border bg-muted/20 max-h-40 overflow-y-auto">
                {funcionarios?.filter(f => f.ativo && f.perfil !== "ADMIN").map(f => (
                  <label key={f.id} className="flex items-center gap-2 p-1 hover:bg-primary/5 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.tecnicosIds.includes(f.id)}
                      onChange={(e) => {
                        const ids = e.target.checked
                          ? [...editForm.tecnicosIds, f.id]
                          : editForm.tecnicosIds.filter(tid => tid !== f.id);
                        setEditForm(prev => ({ ...prev, tecnicosIds: ids }));
                      }}
                      className="w-4 h-4 rounded border-border"
                    />
                    <span className="text-xs text-foreground">{f.nome}</span>
                  </label>
                ))}
                {(!funcionarios || funcionarios.filter(f => f.ativo && f.perfil !== "ADMIN").length === 0) && (
                  <p className="text-[10px] text-muted-foreground italic">Nenhum técnico cadastrado.</p>
                )}
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Data Prevista</Label>
              <Input
                type="date"
                value={editForm.dataPrevista}
                onChange={(e) => setEditForm(prev => ({ ...prev, dataPrevista: e.target.value }))}
                className="bg-input border-border h-9"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Endereço</Label>
              <Input
                value={editForm.enderecoExecucao}
                onChange={(e) => setEditForm(prev => ({ ...prev, enderecoExecucao: e.target.value }))}
                className="bg-input border-border h-9"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Observações</Label>
              <Textarea
                value={editForm.observacoes}
                onChange={(e) => setEditForm(prev => ({ ...prev, observacoes: e.target.value }))}
                className="bg-input border-border resize-none"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setModalEdit(false)}>Cancelar</Button>
            <Button size="sm" onClick={() => atualizarMutation.mutate({ id: instalacaoId, ...editForm })} disabled={atualizarMutation.isPending}>
              {atualizarMutation.isPending && <Loader2 className="w-3 h-3 animate-spin mr-2" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Concluir OS */}
      <Dialog open={modalConcluir} onOpenChange={setModalConcluir}>
        <DialogContent className="max-w-md bg-card border-border overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Finalização de Serviço</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Checklist */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <List className="w-4 h-4 text-primary" /> Checklist de Qualidade
              </h4>
              <div className="space-y-3">
                {CHECKLIST_ITEMS[data.instalacao.tipo]?.map((item) => (
                  <div key={item} className="flex items-center space-x-2">
                    <Checkbox
                      id={item}
                      checked={itensChecklist[item] || false}
                      onCheckedChange={(checked) => setItensChecklist(prev => ({ ...prev, [item]: !!checked }))}
                    />
                    <Label htmlFor={item} className="text-sm cursor-pointer">{item}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Assinatura */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-primary" /> Assinatura do Cliente
              </h4>
              {assinatura ? (
                <div className="relative border border-border rounded-lg bg-white p-2">
                  <img src={assinatura} className="w-full h-32 object-contain" alt="Assinatura" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 text-red-500"
                    onClick={() => setAssinatura(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <SignaturePad onSave={(base64) => setAssinatura(base64)} />
              )}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setModalConcluir(false)}>Cancelar</Button>
            <Button
              className="bg-green-600 hover:bg-green-700 gap-2"
              disabled={!assinatura || alterarStatusMutation.isPending}
              onClick={async () => {
                const gps = await getGeolocation();
                alterarStatusMutation.mutate({
                  id: instalacaoId,
                  status: "CONCLUIDA",
                  gps,
                  assinaturaUrl: assinatura || undefined,
                  checklist: itensChecklist
                });
                setModalConcluir(false);
              }}
            >
              {alterarStatusMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Concluir e Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
