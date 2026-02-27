import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3 } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  PENDENTE: "Pendente", EM_ANDAMENTO: "Em Andamento", CONCLUIDA: "Concluída", CANCELADA: "Cancelada",
};
const STATUS_CLASSES: Record<string, string> = {
  PENDENTE: "badge-pendente", EM_ANDAMENTO: "badge-em-andamento",
  CONCLUIDA: "badge-concluida", CANCELADA: "badge-cancelada",
};
const TIPO_LABELS: Record<string, string> = { ALARME: "Alarme", CAMERA: "Câmera", CERCA: "Cerca" };

export default function AdminRelatorioInstalacoes() {
  const hoje = new Date();
  const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  const [de, setDe] = useState(primeiroDiaMes.toISOString().split("T")[0]);
  const [ate, setAte] = useState(hoje.toISOString().split("T")[0]);
  const [status, setStatus] = useState("TODOS");
  const [tipo, setTipo] = useState("TODOS");

  const { data: instalacoes, isLoading } = trpc.relatorios.instalacoes.useQuery({
    de: de || undefined,
    ate: ate || undefined,
    status: (status === "TODOS" || !status) ? undefined : status,
    tipo: (tipo === "TODOS" || !tipo) ? undefined : tipo,
  });

  return (
    <AppLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold text-foreground">Relatório de Instalações</h1>
          <p className="text-sm text-muted-foreground">{instalacoes?.length ?? 0} OS encontrada(s)</p>
        </div>

        <Card className="border-border">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1">Data Início</Label>
                <Input type="date" value={de} onChange={(e) => setDe(e.target.value)} className="bg-input border-border text-sm h-9" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1">Data Fim</Label>
                <Input type="date" value={ate} onChange={(e) => setAte(e.target.value)} className="bg-input border-border text-sm h-9" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="bg-input border-border text-sm h-9">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos</SelectItem>
                    {Object.entries(STATUS_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1">Tipo</Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger className="bg-input border-border text-sm h-9">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos</SelectItem>
                    {Object.entries(TIPO_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" /> Instalações
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {isLoading ? (
              <div className="p-6 text-center text-muted-foreground text-sm">A carregar...</div>
            ) : !instalacoes || instalacoes.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">Nenhuma instalação encontrada.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">OS</th>
                    <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">Cliente</th>
                    <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">Tipo</th>
                    <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">Responsável</th>
                    <th className="text-center px-4 py-2 text-xs text-muted-foreground font-medium">Status</th>
                    <th className="text-center px-4 py-2 text-xs text-muted-foreground font-medium">Data Prevista</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {instalacoes.map((item) => (
                    <tr key={item.instalacao.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2.5 font-medium text-foreground">#{String(item.instalacao.id).padStart(5, "0")}</td>
                      <td className="px-4 py-2.5 text-foreground">{item.clienteNome}</td>
                      <td className="px-4 py-2.5 text-foreground">{TIPO_LABELS[item.instalacao.tipo]}</td>
                      <td className="px-4 py-2.5 text-foreground">{item.funcionarioNome ?? "—"}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLASSES[item.instalacao.status]}`}>
                          {STATUS_LABELS[item.instalacao.status]}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center text-foreground">
                        {item.instalacao.dataPrevista
                          ? new Date(item.instalacao.dataPrevista).toLocaleDateString("pt-BR")
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
