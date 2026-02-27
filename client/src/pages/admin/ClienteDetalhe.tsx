import { useParams, useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Edit, FileText, Phone, Mail, MapPin, Wrench, Download, Loader2 } from "lucide-react";

export default function ClienteDetalhe() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const clienteId = parseInt(params.id);

  const { data, isLoading, refetch } = trpc.clientes.buscar.useQuery({ id: clienteId });
  const gerarFichaMutation = trpc.clientes.gerarFicha.useMutation({
    onSuccess: (res) => {
      toast.success("Ficha PDF gerada com sucesso!");
      if (res.arquivoUrl) window.open(res.arquivoUrl, "_blank");
      refetch();
    },
    onError: (err) => toast.error("Erro ao gerar PDF: " + err.message),
  });

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
        <div className="text-center py-20 text-muted-foreground">Cliente não encontrado.</div>
      </AppLayout>
    );
  }

  const campo = (label: string, valor: string | null | undefined) =>
    valor ? (
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{valor}</p>
      </div>
    ) : null;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/clientes")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground truncate">{data.nomeRazao}</h1>
            <p className="text-xs text-muted-foreground">
              {data.tipo === "PJ" ? "Pessoa Jurídica" : "Pessoa Física"} · #{String(data.id).padStart(5, "0")}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => gerarFichaMutation.mutate({ id: clienteId })}
              disabled={gerarFichaMutation.isPending}
            >
              {gerarFichaMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              <span className="hidden sm:inline">Gerar PDF</span>
            </Button>
            <Button size="sm" className="gap-2" onClick={() => navigate(`/admin/clientes/${clienteId}/editar`)}>
              <Edit className="w-4 h-4" />
              <span className="hidden sm:inline">Editar</span>
            </Button>
          </div>
        </div>

        {/* Identificação */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-primary uppercase tracking-wider">Identificação</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {campo(data.tipo === "PJ" ? "Razão Social" : "Nome Completo", data.nomeRazao)}
            {campo(data.tipo === "PJ" ? "CNPJ" : "CPF", data.cpfCnpj)}
            {campo(data.tipo === "PJ" ? "Inscrição Estadual" : "RG", data.rgIe)}
            {data.tipo === "PF" && campo("Data de Nascimento", data.nascimento ? new Date(data.nascimento).toLocaleDateString("pt-BR") : null)}
          </CardContent>
        </Card>

        {/* Contato */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-primary uppercase tracking-wider">Contato</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {campo("Telefone 1", data.telefone1)}
            {campo("Telefone 2", data.telefone2)}
            {campo("WhatsApp", data.whatsapp)}
            {campo("E-mail", data.email)}
          </CardContent>
        </Card>

        {/* Endereço */}
        {(data.rua || data.cidade) && (
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-primary uppercase tracking-wider">Endereço</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {campo("Rua", data.rua ? `${data.rua}, ${data.numero ?? "S/N"}` : null)}
              {campo("Bairro", data.bairro)}
              {campo("Cidade/UF", data.cidade ? `${data.cidade}/${data.uf}` : null)}
              {campo("CEP", data.cep)}
              {campo("Complemento", data.complemento)}
              {campo("Referência", data.referencia)}
            </CardContent>
          </Card>
        )}

        {/* Observações */}
        {data.observacoes && (
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-primary uppercase tracking-wider">Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground">{data.observacoes}</p>
            </CardContent>
          </Card>
        )}

        {/* Fichas PDF geradas */}
        {data.fichas && data.fichas.length > 0 && (
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-primary uppercase tracking-wider">Fichas PDF Geradas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.fichas.map((ficha: any) => (
                <a
                  key={ficha.id}
                  href={ficha.arquivoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 transition-all"
                >
                  <Download className="w-4 h-4 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">Ficha #{ficha.id}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(ficha.geradoEm).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </a>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
