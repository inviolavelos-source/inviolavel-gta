import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserCircle, Wrench, CheckCircle, Clock, AlertCircle, Plus, ArrowRight, BarChart3 } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";

export default function AdminDashboard() {
  const { funcionario } = useAuth();
  const { data: resumo, isLoading } = trpc.relatorios.dashboardAdmin.useQuery();
  const { data: instalacoes } = trpc.instalacoes.listar.useQuery({ status: "PENDENTE" });
  const recentesInstalacoes = instalacoes?.slice(0, 5) ?? [];

  const cards = [
    { label: "Clientes", value: resumo?.totalClientes ?? 0, icon: UserCircle, color: "text-blue-400", bg: "bg-blue-500/10", href: "/admin/clientes" },
    { label: "Instalações", value: resumo?.totalInstalacoes ?? 0, icon: Wrench, color: "text-yellow-400", bg: "bg-yellow-500/10", href: "/admin/instalacoes" },
    { label: "Funcionários", value: resumo?.totalFuncionarios ?? 0, icon: Users, color: "text-green-400", bg: "bg-green-500/10", href: "/admin/funcionarios" },
    { label: "Pendentes", value: resumo?.instalacoesPendentes ?? 0, icon: AlertCircle, color: "text-orange-400", bg: "bg-orange-500/10", href: "/admin/instalacoes" },
    { label: "Concluídas", value: resumo?.instalacoesConcluidas ?? 0, icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10", href: "/admin/instalacoes" },
  ];

  const statusLabel: Record<string, string> = {
    PENDENTE: "Pendente",
    EM_ANDAMENTO: "Em Andamento",
    CONCLUIDA: "Concluída",
    CANCELADA: "Cancelada",
  };

  const statusClass: Record<string, string> = {
    PENDENTE: "badge-pendente",
    EM_ANDAMENTO: "badge-em-andamento",
    CONCLUIDA: "badge-concluida",
    CANCELADA: "badge-cancelada",
  };

  const tipoLabel: Record<string, string> = { ALARME: "Alarme", CAMERA: "Câmera", CERCA: "Cerca" };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Bem-vindo, {funcionario?.nome?.split(" ")[0]}!
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">Painel de gestão INVIOLÁVEL</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/clientes/novo">
              <Button size="sm" variant="outline" className="gap-2">
                <Plus className="w-4 h-4" /> Cliente
              </Button>
            </Link>
            <Link href="/admin/instalacoes">
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" /> Instalação
              </Button>
            </Link>
          </div>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {cards.map((card) => (
            <Link key={card.label} href={card.href}>
              <a className="block">
                <Card className="border-border hover:border-primary/50 transition-all cursor-pointer group">
                  <CardContent className="p-4">
                    <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>
                      <card.icon className={`w-5 h-5 ${card.color}`} />
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      {isLoading ? "—" : card.value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
                  </CardContent>
                </Card>
              </a>
            </Link>
          ))}
        </div>

        {/* Instalações pendentes recentes */}
        <Card className="border-border">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Instalações Pendentes</CardTitle>
            <Link href="/admin/instalacoes">
              <Button variant="ghost" size="sm" className="gap-1 text-primary h-8">
                Ver todas <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentesInstalacoes.length === 0 ? (
              <div className="px-6 py-8 text-center text-muted-foreground text-sm">
                Nenhuma instalação pendente.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentesInstalacoes.map((item) => (
                  <Link key={item.instalacao.id} href={`/admin/instalacoes/${item.instalacao.id}`}>
                    <a className="flex items-center gap-3 px-6 py-3 hover:bg-muted/30 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          #{String(item.instalacao.id).padStart(5, "0")} — {item.clienteNome}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {tipoLabel[item.instalacao.tipo]} · {item.funcionarioNome ?? "Sem responsável"}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusClass[item.instalacao.status]}`}>
                        {statusLabel[item.instalacao.status]}
                      </span>
                    </a>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Desempenho e Estoque */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-border overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" /> Produtividade (OS Concluídas)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 h-[250px] w-full">
              {resumo?.performanceTecnicos && resumo.performanceTecnicos.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={resumo.performanceTecnicos} layout="vertical" margin={{ left: -20, right: 20, top: 0, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="nome"
                      type="category"
                      width={80}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'currentColor', fontSize: 10, opacity: 0.8 }}
                    />
                    <Tooltip
                      cursor={{ fill: 'white', opacity: 0.05 }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-card border border-border p-2 rounded-lg shadow-xl text-[10px]">
                              <p className="font-bold text-foreground">{payload[0].payload.nome}</p>
                              <p className="text-primary">{payload[0].value} OS Concluídas</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="concluidas" radius={[0, 4, 4, 0]} barSize={20}>
                      {resumo.performanceTecnicos.map((_: any, index: number) => (
                        <Cell key={index} fill={`var(--primary)`} fillOpacity={1 - (index * 0.15)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                  <p className="text-xs">Nenhum dado disponível</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" /> Alertas de Estoque (Baixo)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {resumo?.estoqueBaixo?.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between bg-red-500/5 p-2 rounded border border-red-500/20">
                    <span className="text-xs font-medium">{p.nome}</span>
                    <span className="text-xs text-red-400 font-bold">{p.estoque} {p.unidade}</span>
                  </div>
                ))}
                {(!resumo?.estoqueBaixo || resumo.estoqueBaixo.length === 0) && (
                  <p className="text-xs text-green-400 text-center py-4">Estoque em dia.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Atalhos rápidos */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Novo Cliente", href: "/admin/clientes/novo", icon: UserCircle },
            { label: "Nova Instalação", href: "/admin/instalacoes", icon: Wrench },
            { label: "Novo Produto", href: "/admin/produtos", icon: Plus },
            { label: "Relatório Ponto", href: "/admin/relatorios/ponto", icon: Clock },
          ].map((atalho) => (
            <Link key={atalho.href} href={atalho.href}>
              <a className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/20 transition-all text-center">
                <atalho.icon className="w-6 h-6 text-primary" />
                <span className="text-xs font-medium text-foreground">{atalho.label}</span>
              </a>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
