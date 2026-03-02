import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Clock, Download } from "lucide-react";

export default function AdminRelatorioPonto() {
  const hoje = new Date();
  const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  const [de, setDe] = useState(primeiroDiaMes.toISOString().split("T")[0]);
  const [ate, setAte] = useState(hoje.toISOString().split("T")[0]);
  const [funcionarioId, setFuncionarioId] = useState("TODOS");

  const { data: funcionarios } = trpc.funcionarios.listar.useQuery();
  const { data: pontos, isLoading } = trpc.ponto.relatorio.useQuery({
    de: de ?? "",
    ate: ate ?? "",
    funcionarioId: (funcionarioId && funcionarioId !== "TODOS") ? parseInt(funcionarioId) : undefined,
  });

  const formatarHora = (dt: any, isManual?: number) => {
    if (!dt) return "—";
    const time = new Date(dt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    if (isManual === 1) {
      return (
        <div className="flex flex-col items-center">
          <span className="text-foreground">{time}</span>
          <span className="text-[9px] leading-none bg-amber-500/10 text-amber-600 px-1 rounded font-bold mt-0.5 border border-amber-500/20">MANUAL</span>
        </div>
      );
    }
    return time;
  };

  const calcularTotal = (ponto: any) => {
    if (!ponto.horaEntrada) return "—";
    const entrada = new Date(ponto.horaEntrada).getTime();
    const saida = ponto.horaSaida ? new Date(ponto.horaSaida).getTime() : null;
    if (!saida) return "Em andamento";
    let total = saida - entrada;
    if (ponto.horaInicioAlmoco && ponto.horaFimAlmoco) {
      total -= new Date(ponto.horaFimAlmoco).getTime() - new Date(ponto.horaInicioAlmoco).getTime();
    }
    const h = Math.floor(total / 3600000);
    const m = Math.floor((total % 3600000) / 60000);
    return `${h}h ${m}min`;
  };

  const totalRegistros = pontos?.length ?? 0;

  return (
    <AppLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold text-foreground">Relatório de Ponto</h1>
          <p className="text-sm text-muted-foreground">{totalRegistros} registo(s) encontrado(s)</p>
        </div>

        {/* Filtros */}
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1">Data Início</Label>
                <Input type="date" value={de} onChange={(e) => setDe(e.target.value)} className="bg-input border-border text-sm h-9" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1">Data Fim</Label>
                <Input type="date" value={ate} onChange={(e) => setAte(e.target.value)} className="bg-input border-border text-sm h-9" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1">Funcionário</Label>
                <Select value={funcionarioId} onValueChange={setFuncionarioId}>
                  <SelectTrigger className="bg-input border-border text-sm h-9">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos</SelectItem>
                    {funcionarios?.map((f) => (
                      <SelectItem key={f.id} value={String(f.id)}>{f.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Registos de Ponto
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {isLoading ? (
              <div className="p-6 text-center text-muted-foreground text-sm">A carregar...</div>
            ) : !pontos || pontos.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">Nenhum registo encontrado.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">Funcionário</th>
                    <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">Data</th>
                    <th className="text-center px-3 py-2 text-xs text-muted-foreground font-medium">Entrada</th>
                    <th className="text-center px-3 py-2 text-xs text-muted-foreground font-medium">Almoço</th>
                    <th className="text-center px-3 py-2 text-xs text-muted-foreground font-medium">Regresso</th>
                    <th className="text-center px-3 py-2 text-xs text-muted-foreground font-medium">Saída</th>
                    <th className="text-center px-3 py-2 text-xs text-muted-foreground font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pontos.map((item) => (
                    <tr key={item.ponto.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2.5 text-foreground font-medium">
                        {item.funcionarioNome ?? "—"}
                        {item.ponto.justificativaManual && (
                          <p className="text-[10px] text-muted-foreground font-normal italic mt-0.5">
                            "{item.ponto.justificativaManual}"
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-foreground leading-tight">
                        {new Date(item.ponto.data + 'T00:00:00').toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-3 py-2.5 text-center text-foreground">{formatarHora(item.ponto.horaEntrada, item.ponto.isManualEntrada ?? 0)}</td>
                      <td className="px-3 py-2.5 text-center text-foreground">{formatarHora(item.ponto.horaInicioAlmoco, item.ponto.isManualInicioAlmoco ?? 0)}</td>
                      <td className="px-3 py-2.5 text-center text-foreground">{formatarHora(item.ponto.horaFimAlmoco, item.ponto.isManualFimAlmoco ?? 0)}</td>
                      <td className="px-3 py-2.5 text-center text-foreground">{formatarHora(item.ponto.horaSaida, item.ponto.isManualSaida ?? 0)}</td>
                      <td className="px-3 py-2.5 text-center font-medium text-primary">{calcularTotal(item.ponto)}</td>
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
