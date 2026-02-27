import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, CheckCircle, Wrench } from "lucide-react";

export default function AppHistorico() {
  const hoje = new Date();
  const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  const [dataInicio, setDataInicio] = useState(primeiroDiaMes.toISOString().split("T")[0]);
  const [dataFim, setDataFim] = useState(hoje.toISOString().split("T")[0]);

  const { data: pontos } = trpc.ponto.meuHistorico.useQuery({
    dataInicio: dataInicio ?? "",
    dataFim: dataFim ?? "",
  });

  const { data: instalacoes } = trpc.instalacoes.minhasInstalacoes.useQuery({ status: "CONCLUIDA" });

  const formatarHora = (dt: Date | null | undefined) => {
    if (!dt) return "—";
    return new Date(dt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const calcularTotal = (item: { ponto: { horaEntrada: Date | null; horaSaida: Date | null; horaInicioAlmoco: Date | null; horaFimAlmoco: Date | null } }) => {
    const p = item.ponto;
    if (!p.horaEntrada) return "—";
    const entrada = new Date(p.horaEntrada).getTime();
    const saida = p.horaSaida ? new Date(p.horaSaida).getTime() : null;
    if (!saida) return "Em andamento";
    let total = saida - entrada;
    if (p.horaInicioAlmoco && p.horaFimAlmoco) {
      total -= new Date(p.horaFimAlmoco).getTime() - new Date(p.horaInicioAlmoco).getTime();
    }
    const h = Math.floor(total / 3600000);
    const m = Math.floor((total % 3600000) / 60000);
    return `${h}h ${m}min`;
  };

  return (
    <AppLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold text-foreground">Histórico</h1>
          <p className="text-sm text-muted-foreground">Registo de ponto e instalações concluídas</p>
        </div>

        {/* Filtro de período */}
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1">Data Início</Label>
                <Input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="bg-input border-border text-sm h-9"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1">Data Fim</Label>
                <Input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="bg-input border-border text-sm h-9"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Registo de ponto */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Registo de Ponto
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!pontos || pontos.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-6">Nenhum registo no período.</p>
            ) : (
              <div className="divide-y divide-border">
                {pontos.map((item) => (
                  <div key={item.ponto.id} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-sm font-medium text-foreground">
                        {new Date(item.ponto.data).toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" })}
                      </p>
                      <span className="text-xs font-medium text-primary">{calcularTotal(item)}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      {[
                        { label: "Entrada", valor: formatarHora(item.ponto.horaEntrada) },
                        { label: "Almoço", valor: formatarHora(item.ponto.horaInicioAlmoco) },
                        { label: "Regresso", valor: formatarHora(item.ponto.horaFimAlmoco) },
                        { label: "Saída", valor: formatarHora(item.ponto.horaSaida) },
                      ].map((col) => (
                        <div key={col.label} className="text-center">
                          <p className="text-xs text-muted-foreground">{col.label}</p>
                          <p className="text-xs font-medium text-foreground">{col.valor}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instalações concluídas */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" /> Instalações Concluídas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!instalacoes || instalacoes.length === 0 ? (
              <p className="text-center text-sm text-muted-foreidas py-6">Nenhuma instalação concluída.</p>
            ) : (
              <div className="divide-y divide-border">
                {instalacoes.map((item) => (
                  <div key={item.instalacao.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                      <Wrench className="w-4 h-4 text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        #{String(item.instalacao.id).padStart(5, "0")} — {item.clienteNome}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.instalacao.finalizadoEm
                          ? new Date(item.instalacao.finalizadoEm).toLocaleDateString("pt-BR")
                          : "—"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
