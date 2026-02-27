import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, Clock, CheckCircle, AlertCircle, ArrowRight, Play } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { cn } from "@/lib/utils";

export default function AppDashboard() {
  const { funcionario } = useAuth();
  const { data: resumo } = trpc.relatorios.dashboardFuncionario.useQuery();
  const { data: pontoHoje } = trpc.ponto.meuPontoHoje.useQuery();
  const { data: instalacoes } = trpc.instalacoes.minhasInstalacoes.useQuery({ status: "PENDENTE" });
  const recentesInstalacoes = instalacoes?.slice(0, 3) ?? [];

  const formatarHora = (dt: Date | string | null | undefined) => {
    if (!dt) return "—";
    return new Date(dt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const tipoLabel: Record<string, string> = { ALARME: "Alarme", CAMERA: "Câmera", CERCA: "Cerca" };

  const statusPonto = () => {
    if (!pontoHoje) return { label: "Sem registo hoje", color: "text-muted-foreground" };
    if (pontoHoje.horaSaida) return { label: "Saída registada", color: "text-green-400" };
    if (pontoHoje.horaFimAlmoco) return { label: "A trabalhar", color: "text-yellow-400" };
    if (pontoHoje.horaInicioAlmoco) return { label: "Em almoço", color: "text-orange-400" };
    if (pontoHoje.horaEntrada) return { label: "Entrada registada", color: "text-blue-400" };
    return { label: "Sem registo hoje", color: "text-muted-foreground" };
  };

  const sp = statusPonto();

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Olá, {funcionario?.nome?.split(" ")[0]}!
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>

        {/* Ponto do dia */}
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <span className="font-semibold text-sm">Ponto de Hoje</span>
              </div>
              <span className={`text-xs font-medium ${sp.color}`}>{sp.label}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              {[
                { label: "Entrada", valor: formatarHora(pontoHoje?.horaEntrada) },
                { label: "Almoço", valor: formatarHora(pontoHoje?.horaInicioAlmoco) },
                { label: "Regresso", valor: formatarHora(pontoHoje?.horaFimAlmoco) },
                { label: "Saída", valor: formatarHora(pontoHoje?.horaSaida) },
              ].map((p) => (
                <div key={p.label} className="text-center p-2 rounded-lg bg-muted/30">
                  <p className="text-[10px] sm:text-xs text-muted-foreground">{p.label}</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">{p.valor}</p>
                </div>
              ))}
            </div>
            <Link href="/app/ponto">
              <Button className="w-full gap-2" size="sm">
                <Play className="w-4 h-4" /> Registar Ponto
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Resumo instalações */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: "Atribuídas", value: resumo?.totalAtribuidas ?? 0, icon: Wrench, color: "text-yellow-400", bg: "bg-yellow-500/10" },
            { label: "Pendentes", value: resumo?.totalPendentes ?? 0, icon: AlertCircle, color: "text-orange-400", bg: "bg-orange-500/10" },
            { label: "Concluídas", value: resumo?.totalConcluidas ?? 0, icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/10" },
          ].map((card, idx) => (
            <Card key={card.label} className={cn("border-border", idx === 2 && "col-span-2 sm:col-span-1")}>
              <CardContent className="p-3 text-center">
                <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center mx-auto mb-2`}>
                  <card.icon className={`w-4 h-4 ${card.color}`} />
                </div>
                <p className="text-xl font-bold text-foreground">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Instalações pendentes */}
        <Card className="border-border">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="font-semibold text-sm">Minhas Instalações Pendentes</span>
            <Link href="/app/instalacoes">
              <Button variant="ghost" size="sm" className="gap-1 text-primary h-7 text-xs">
                Ver todas <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
          {recentesInstalacoes.length === 0 ? (
            <div className="px-4 py-8 text-center text-muted-foreground text-sm">
              Nenhuma instalação pendente.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentesInstalacoes.map((item) => (
                <Link key={item.instalacao.id} href={`/app/instalacoes/${item.instalacao.id}`}>
                  <a className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Wrench className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        #{String(item.instalacao.id).padStart(5, "0")} — {item.clienteNome}
                      </p>
                      <p className="text-xs text-muted-foreground">{tipoLabel[item.instalacao.tipo]}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </a>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
