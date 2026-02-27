import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Save, FileText, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const UFS = ["AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO"];

const RAMOS = ["Comercial", "Residencial", "Industrial", "Pública", "Outros"];

export default function ClienteForm() {
  const params = useParams<{ id?: string }>();
  const [, navigate] = useLocation();
  const isEdit = !!params.id && params.id !== "novo";
  const clienteId = isEdit ? parseInt(params.id!) : undefined;

  const { data: clienteExistente, isLoading: loadingCliente } = trpc.clientes.buscar.useQuery(
    { id: clienteId! },
    { enabled: isEdit }
  );

  const [form, setForm] = useState({
    tipo: "PF" as "PF" | "PJ",
    nomeRazao: "",
    nomeFantasia: "",
    cpfCnpj: "",
    rgIe: "",
    nascimento: "",
    telefone1: "",
    telefone2: "",
    whatsapp: "",
    email: "",
    cep: "",
    rua: "",
    numero: "",
    bairro: "",
    cidade: "",
    uf: "",
    complemento: "",
    proximidade: "",
    rota: "",
    referencia: "",
    observacoes: "",

    // Novos campos
    clienteNovo: true,
    dataCadastro: "",
    codigo: "",
    modeloCentral: "AMT 2018E",
    dataInstalacao: "",
    tipoContrato: "LOCADO",
    ramoAtividade: "Comercial",
    responsavelNome: "",
    responsavelNascimento: "",
    responsavelCpf: "",
    responsavelRg: "",
    responsavelEndereco: "",
    responsavelNumero: "",
    responsavelBairro: "",
    responsavelCidade: "",
    responsavelEstado: "",
    nomeProprietario: "",
    nomeInstalador: "",
    nomeVendedor: "",
  });

  useEffect(() => {
    if (clienteExistente) {
      setForm({
        tipo: clienteExistente.tipo as "PF" | "PJ",
        nomeRazao: clienteExistente.nomeRazao ?? "",
        nomeFantasia: clienteExistente.nomeFantasia ?? "",
        cpfCnpj: clienteExistente.cpfCnpj ?? "",
        rgIe: clienteExistente.rgIe ?? "",
        nascimento: clienteExistente.nascimento ? String(clienteExistente.nascimento).split('T')[0] ?? "" : "",
        telefone1: clienteExistente.telefone1 ?? "",
        telefone2: clienteExistente.telefone2 ?? "",
        whatsapp: clienteExistente.whatsapp ?? "",
        email: clienteExistente.email ?? "",
        cep: clienteExistente.cep ?? "",
        rua: clienteExistente.rua ?? "",
        numero: clienteExistente.numero ?? "",
        bairro: clienteExistente.bairro ?? "",
        cidade: clienteExistente.cidade ?? "",
        uf: clienteExistente.uf ?? "",
        complemento: clienteExistente.complemento ?? "",
        proximidade: clienteExistente.proximidade ?? "",
        rota: clienteExistente.rota ?? "",
        referencia: clienteExistente.referencia ?? "",
        observacoes: clienteExistente.observacoes ?? "",

        clienteNovo: clienteExistente.clienteNovo === 1,
        dataCadastro: clienteExistente.dataCadastro ?? "",
        codigo: clienteExistente.codigo ?? "",
        modeloCentral: clienteExistente.modeloCentral ?? "",
        dataInstalacao: clienteExistente.dataInstalacao ?? "",
        tipoContrato: clienteExistente.tipoContrato ?? "LOCADO",
        ramoAtividade: clienteExistente.ramoAtividade ?? "Comercial",
        responsavelNome: clienteExistente.responsavelNome ?? "",
        responsavelNascimento: clienteExistente.responsavelNascimento ?? "",
        responsavelCpf: clienteExistente.responsavelCpf ?? "",
        responsavelRg: clienteExistente.responsavelRg ?? "",
        responsavelEndereco: clienteExistente.responsavelEndereco ?? "",
        responsavelNumero: clienteExistente.responsavelNumero ?? "",
        responsavelBairro: clienteExistente.responsavelBairro ?? "",
        responsavelCidade: clienteExistente.responsavelCidade ?? "",
        responsavelEstado: clienteExistente.responsavelEstado ?? "",
        nomeProprietario: clienteExistente.nomeProprietario ?? "",
        nomeInstalador: clienteExistente.nomeInstalador ?? "",
        nomeVendedor: clienteExistente.nomeVendedor ?? "",
      });
    }
  }, [clienteExistente]);

  const utils = trpc.useUtils();

  const criarMutation = trpc.clientes.criar.useMutation({
    onSuccess: () => {
      toast.success("Cliente cadastrado com sucesso!");
      utils.clientes.listar.invalidate();
      navigate("/admin/clientes");
    },
    onError: (err) => toast.error(err.message),
  });

  const atualizarMutation = trpc.clientes.atualizar.useMutation({
    onSuccess: () => {
      toast.success("Cliente atualizado com sucesso!");
      utils.clientes.listar.invalidate();
      navigate(`/admin/clientes/${clienteId}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const gerarFichaMutation = trpc.clientes.gerarFicha.useMutation({
    onSuccess: (data) => {
      toast.success("Ficha PDF gerada com sucesso!");
      if (data.arquivoUrl) window.open(data.arquivoUrl, "_blank");
      utils.clientes.buscar.invalidate({ id: clienteId! });
    },
    onError: (err) => toast.error("Erro ao gerar PDF: " + err.message),
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nomeRazao || !form.cpfCnpj) {
      toast.error("Nome/Razão Social e CPF/CNPJ são obrigatórios.");
      return;
    }
    const dados = {
      tipo: form.tipo,
      nomeRazao: form.nomeRazao,
      nomeFantasia: form.nomeFantasia || null,
      cpfCnpj: form.cpfCnpj,
      rgIe: form.rgIe || null,
      nascimento: form.nascimento || null,
      telefone1: form.telefone1 || null,
      telefone2: form.telefone2 || null,
      whatsapp: form.whatsapp || null,
      email: form.email || null,
      cep: form.cep || null,
      rua: form.rua || null,
      numero: form.numero || null,
      bairro: form.bairro || null,
      cidade: form.cidade || null,
      uf: form.uf || null,
      complemento: form.complemento || null,
      proximidade: form.proximidade || null,
      rota: form.rota || null,
      referencia: form.referencia || null,
      observacoes: form.observacoes || null,

      clienteNovo: form.clienteNovo ? 1 : 0,
      dataCadastro: form.dataCadastro || null,
      codigo: form.codigo || null,
      modeloCentral: form.modeloCentral || null,
      dataInstalacao: form.dataInstalacao || null,
      tipoContrato: form.tipoContrato || null,
      ramoAtividade: form.ramoAtividade || null,
      responsavelNome: form.responsavelNome || null,
      responsavelNascimento: form.responsavelNascimento || null,
      responsavelCpf: form.responsavelCpf || null,
      responsavelRg: form.responsavelRg || null,
      responsavelEndereco: form.responsavelEndereco || null,
      responsavelNumero: form.responsavelNumero || null,
      responsavelBairro: form.responsavelBairro || null,
      responsavelCidade: form.responsavelCidade || null,
      responsavelEstado: form.responsavelEstado || null,
      nomeProprietario: form.nomeProprietario || null,
      nomeInstalador: form.nomeInstalador || null,
      nomeVendedor: form.nomeVendedor || null,
    };
    if (isEdit) {
      atualizarMutation.mutate({ id: clienteId!, ...dados } as any);
    } else {
      criarMutation.mutate(dados as any);
    }
  };

  const isPending = criarMutation.isPending || atualizarMutation.isPending;

  if (isEdit && loadingCliente) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(isEdit ? `/admin/clientes/${clienteId}` : "/admin/clientes")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {isEdit ? "Editar Cliente" : "Novo Cliente"}
            </h1>
            <p className="text-sm text-muted-foreground">Ficha Completa de Cadastro</p>
          </div>
          {isEdit && (
            <Button
              variant="outline"
              size="sm"
              className="ml-auto gap-2"
              onClick={() => gerarFichaMutation.mutate({ id: clienteId! })}
              disabled={gerarFichaMutation.isPending}
            >
              {gerarFichaMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              Gerar Ficha PDF
            </Button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* A — Contrato / Central */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3 border-b border-border bg-muted/20">
              <CardTitle className="text-sm font-semibold text-primary uppercase tracking-wider">A — Ficha da Central e Contrato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex items-center space-x-2 border border-border p-3 rounded-md bg-muted/10 w-fit">
                <Checkbox
                  id="clienteNovo"
                  checked={form.clienteNovo}
                  onCheckedChange={(c) => setForm(f => ({ ...f, clienteNovo: c as boolean }))}
                />
                <Label htmlFor="clienteNovo" className="font-medium cursor-pointer">Cliente Novo?</Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">Data de Cadastro</Label>
                  <Input type="date" value={form.dataCadastro} onChange={set("dataCadastro")} className="bg-input border-border" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">Código</Label>
                  <Input value={form.codigo} onChange={set("codigo")} placeholder="Ex: *0026" className="bg-input border-border" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">Modelo da Central</Label>
                  <Input value={form.modeloCentral} onChange={set("modeloCentral")} className="bg-input border-border" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">Data da Instalação</Label>
                  <Input type="date" value={form.dataInstalacao} onChange={set("dataInstalacao")} className="bg-input border-border" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">Tipo de Contrato</Label>
                  <Select value={form.tipoContrato} onValueChange={(v) => setForm(f => ({ ...f, tipoContrato: v }))}>
                    <SelectTrigger className="bg-input border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PRÓPRIO">Próprio</SelectItem>
                      <SelectItem value="LOCADO">Locado</SelectItem>
                      <SelectItem value="VENDIDO">Vendido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">Nome do Vendedor</Label>
                  <Input value={form.nomeVendedor} onChange={set("nomeVendedor")} className="bg-input border-border uppercase" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">Nome do Instalador</Label>
                  <Input value={form.nomeInstalador} onChange={set("nomeInstalador")} className="bg-input border-border uppercase" />
                </div>
              </div>
            </CardContent>
          </Card>


          {/* B — Identificação da Empresa / Cliente */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3 border-b border-border bg-muted/20">
              <CardTitle className="text-sm font-semibold text-primary uppercase tracking-wider">B — Dados da Empresa / Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">Tipo de Pessoa</Label>
                  <Select value={form.tipo} onValueChange={(v) => setForm((f) => ({ ...f, tipo: v as "PF" | "PJ" }))}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PF">Pessoa Física</SelectItem>
                      <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs text-muted-foreground mb-1">
                    {form.tipo === "PJ" ? "Razão Social *" : "Nome Completo *"}
                  </Label>
                  <Input value={form.nomeRazao} onChange={set("nomeRazao")} className="bg-input border-border uppercase" required />
                </div>
              </div>

              {form.tipo === "PJ" && (
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">Nome Fantasia</Label>
                  <Input value={form.nomeFantasia} onChange={set("nomeFantasia")} className="bg-input border-border uppercase" />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">{form.tipo === "PJ" ? "CNPJ *" : "CPF *"}</Label>
                  <Input value={form.cpfCnpj} onChange={set("cpfCnpj")} className="bg-input border-border" required />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">{form.tipo === "PJ" ? "Inscrição Estadual" : "RG"}</Label>
                  <Input value={form.rgIe} onChange={set("rgIe")} className="bg-input border-border uppercase" />
                </div>
                {form.tipo === "PF" && (
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1">Data de Nascimento</Label>
                    <Input type="date" value={form.nascimento} onChange={set("nascimento")} className="bg-input border-border" />
                  </div>
                )}
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">Ramo de Atividade</Label>
                  <Select value={form.ramoAtividade} onValueChange={(v) => setForm((f) => ({ ...f, ramoAtividade: v }))}>
                    <SelectTrigger className="bg-input border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {RAMOS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* C — Endereço e Contato do Local */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3 border-b border-border bg-muted/20">
              <CardTitle className="text-sm font-semibold text-primary uppercase tracking-wider">C — Endereço e Contato da Central</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-3">
                  <Label className="text-xs text-muted-foreground mb-1">Endereço (Rua / Avenida)</Label>
                  <Input value={form.rua} onChange={set("rua")} className="bg-input border-border uppercase" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">Número</Label>
                  <Input value={form.numero} onChange={set("numero")} className="bg-input border-border" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">Bairro</Label>
                  <Input value={form.bairro} onChange={set("bairro")} className="bg-input border-border uppercase" />
                </div>
                <div className="col-span-1">
                  <Label className="text-xs text-muted-foreground mb-1">Proximidade</Label>
                  <Input value={form.proximidade} onChange={set("proximidade")} className="bg-input border-border uppercase" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">Rota</Label>
                  <Input value={form.rota} onChange={set("rota")} className="bg-input border-border uppercase" />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">CEP</Label>
                  <Input value={form.cep} onChange={set("cep")} className="bg-input border-border" placeholder="00000-000" />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs text-muted-foreground mb-1">Cidade</Label>
                  <Input value={form.cidade} onChange={set("cidade")} className="bg-input border-border uppercase" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">UF</Label>
                  <Select value={form.uf} onValueChange={(v) => setForm((f) => ({ ...f, uf: v }))}>
                    <SelectTrigger className="bg-input border-border"><SelectValue placeholder="UF" /></SelectTrigger>
                    <SelectContent>
                      {UFS.map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border pt-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">Telefone / Fixo</Label>
                  <Input value={form.telefone1} onChange={set("telefone1")} className="bg-input border-border" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">Celular / WhatsApp</Label>
                  <Input value={form.whatsapp} onChange={set("whatsapp")} className="bg-input border-border" />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs text-muted-foreground mb-1">E-mail</Label>
                  <Input type="email" value={form.email} onChange={set("email")} className="bg-input border-border" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* D — Dados do Responsável Legal */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3 border-b border-border bg-muted/20">
              <CardTitle className="text-sm font-semibold text-primary uppercase tracking-wider">D — Dados do Responsável Legal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label className="text-xs text-muted-foreground mb-1">Nome do Responsável</Label>
                  <Input value={form.responsavelNome} onChange={set("responsavelNome")} className="bg-input border-border uppercase" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">Data Nascimento Resp.</Label>
                  <Input type="date" value={form.responsavelNascimento} onChange={set("responsavelNascimento")} className="bg-input border-border" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">CPF Responsável</Label>
                  <Input value={form.responsavelCpf} onChange={set("responsavelCpf")} className="bg-input border-border" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">RG Responsável</Label>
                  <Input value={form.responsavelRg} onChange={set("responsavelRg")} className="bg-input border-border uppercase" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-t border-border pt-4">
                <div className="md:col-span-3">
                  <Label className="text-xs text-muted-foreground mb-1">Endereço do Responsável</Label>
                  <Input value={form.responsavelEndereco} onChange={set("responsavelEndereco")} className="bg-input border-border uppercase" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">Nº Resp.</Label>
                  <Input value={form.responsavelNumero} onChange={set("responsavelNumero")} className="bg-input border-border" />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">Bairro</Label>
                  <Input value={form.responsavelBairro} onChange={set("responsavelBairro")} className="bg-input border-border uppercase" />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs text-muted-foreground mb-1">Cidade</Label>
                  <Input value={form.responsavelCidade} onChange={set("responsavelCidade")} className="bg-input border-border uppercase" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">UF</Label>
                  <Select value={form.responsavelEstado} onValueChange={(v) => setForm((f) => ({ ...f, responsavelEstado: v }))}>
                    <SelectTrigger className="bg-input border-border"><SelectValue placeholder="UF" /></SelectTrigger>
                    <SelectContent>
                      {UFS.map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full gap-2 h-11 text-base uppercase font-bold" disabled={isPending}>
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-5 h-5" />}
            {isEdit ? "Guardar Alterações do Cliente" : "Cadastrar Ficha do Cliente"}
          </Button>
        </form>
      </div>
    </AppLayout>
  );
}
