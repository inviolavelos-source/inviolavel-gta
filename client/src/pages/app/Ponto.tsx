import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Clock, LogIn, Coffee, Utensils, LogOut, CheckCircle, Loader2, Edit3, MapPin } from "lucide-react";
import { getGeolocation } from "@/lib/geo";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type TipoPonto = "ENTRADA" | "INICIO_ALMOCO" | "FIM_ALMOCO" | "SAIDA";

const BOTOES_PONTO: { tipo: TipoPonto; label: string; icon: React.ComponentType<any>; color: string; bg: string }[] = [
  { tipo: "ENTRADA", label: "Registar Entrada", icon: LogIn, color: "text-green-400", bg: "bg-green-500/10 hover:bg-green-500/20 border-green-500/30" },
  { tipo: "INICIO_ALMOCO", label: "Início do Almoço", icon: Coffee, color: "text-orange-400", bg: "bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30" },
  { tipo: "FIM_ALMOCO", label: "Fim do Almoço", icon: Utensils, color: "text-blue-400", bg: "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30" },
  { tipo: "SAIDA", label: "Registar Saída", icon: LogOut, color: "text-red-400", bg: "bg-red-500/10 hover:bg-red-500/20 border-red-500/30" },
];

export default function AppPonto() {
  const [horaAtual, setHoraAtual] = useState(new Date());
  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const [manualTime, setManualTime] = useState("");
  const [manualTipo, setManualTipo] = useState<TipoPonto | null>(null);
  const [justificativa, setJustificativa] = useState("");

  const { data: pontoHoje, refetch, isLoading } = trpc.ponto.meuPontoHoje.useQuery();

  useEffect(() => {
    const interval = setInterval(() => setHoraAtual(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const registrarMutation = trpc.ponto.registrar.useMutation({
    onSuccess: (data) => {
      const labels: Record<TipoPonto, string> = {
        ENTRADA: "Entrada registada",
        INICIO_ALMOCO: "Início de almoço registado",
        FIM_ALMOCO: "Regresso do almoço registado",
        SAIDA: "Saída registada",
      };
      toast.success(labels[data.tipo] + ` às ${formatarHora(data.hora)}`);
      refetch();
      setManualDialogOpen(false);
      setManualTime("");
      setJustificativa("");
    },
    onError: (err) => toast.error(err.message),
  });

  const formatarHora = (dt: any) => {
    if (!dt) return "—";
    return new Date(dt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const jaRegistrado = (tipo: TipoPonto): boolean => {
    if (!pontoHoje) return false;
    const map: Record<TipoPonto, keyof typeof pontoHoje> = {
      ENTRADA: "horaEntrada",
      INICIO_ALMOCO: "horaInicioAlmoco",
      FIM_ALMOCO: "horaFimAlmoco",
      SAIDA: "horaSaida",
    };
    return !!pontoHoje[map[tipo]];
  };

  const proximoRegistro = (): TipoPonto | null => {
    if (!pontoHoje?.horaEntrada) return "ENTRADA";
    if (!pontoHoje?.horaInicioAlmoco) return "INICIO_ALMOCO";
    if (!pontoHoje?.horaFimAlmoco) return "FIM_ALMOCO";
    if (!pontoHoje?.horaSaida) return "SAIDA";
    return null;
  };

  const proximo = proximoRegistro();

  const calcularHorasTrabalhadas = () => {
    if (!pontoHoje?.horaEntrada) return null;
    const entrada = new Date(pontoHoje.horaEntrada).getTime();
    const saida = pontoHoje.horaSaida ? new Date(pontoHoje.horaSaida).getTime() : Date.now();
    let total = saida - entrada;
    if (pontoHoje.horaInicioAlmoco && pontoHoje.horaFimAlmoco) {
      total -= new Date(pontoHoje.horaFimAlmoco).getTime() - new Date(pontoHoje.horaInicioAlmoco).getTime();
    }
    const horas = Math.floor(total / 3600000);
    const minutos = Math.floor((total % 3600000) / 60000);
    return `${horas}h ${minutos}min`;
  };

  const horasTrabalhadas = calcularHorasTrabalhadas();

  const handleManualSubmit = () => {
    if (!manualTipo || !manualTime) return;
    registrarMutation.mutate({
      tipo: manualTipo,
      horaManual: manualTime,
      justificativa,
    });
  };

  return (
    <AppLayout>
      <div className="max-w-md mx-auto space-y-5">
        {/* Relógio */}
        <Card className="border-border bg-card">
          <CardContent className="p-6 text-center">
            <p className="text-xs text-muted-foreground mb-1">
              {horaAtual.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
            <p className="text-5xl font-bold text-foreground tracking-tight font-mono">
              {horaAtual.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
            {horasTrabalhadas && (
              <p className="text-sm text-primary mt-2 font-medium">
                {pontoHoje?.horaSaida ? "Total trabalhado" : "A trabalhar há"}: {horasTrabalhadas}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Resumo do dia */}
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Registo de Hoje</p>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[10px] gap-1"
                onClick={() => {
                  setManualTipo(proximo || "ENTRADA");
                  const agora = new Date();
                  setManualTime(`${agora.getHours().toString().padStart(2, '0')}:${agora.getMinutes().toString().padStart(2, '0')}`);
                  setManualDialogOpen(true);
                }}
              >
                <Edit3 className="w-3 h-3" />
                Registo Manual
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Entrada", valor: formatarHora(pontoHoje?.horaEntrada), icon: LogIn },
                { label: "Almoço", valor: formatarHora(pontoHoje?.horaInicioAlmoco), icon: Coffee },
                { label: "Regresso", valor: formatarHora(pontoHoje?.horaFimAlmoco), icon: Utensils },
                { label: "Saída", valor: formatarHora(pontoHoje?.horaSaida), icon: LogOut },
              ].map((item) => (
                <div key={item.label} className="text-center p-2 rounded-lg bg-muted/30">
                  <item.icon className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-semibold text-foreground">{item.valor}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Botões de registo */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : pontoHoje?.horaSaida ? (
          <Card className="border-border">
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="font-semibold text-foreground">Jornada concluída!</p>
              <p className="text-sm text-muted-foreground mt-1">Todos os registos do dia foram efetuados.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {BOTOES_PONTO.map((btn) => {
              const registrado = jaRegistrado(btn.tipo);
              const isProximo = proximo === btn.tipo;
              return (
                <button
                  key={btn.tipo}
                  onClick={async () => {
                    if (registrado) return;
                    const gps = await getGeolocation();
                    registrarMutation.mutate({ tipo: btn.tipo, gps });
                  }}
                  disabled={registrado || registrarMutation.isPending}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${registrado
                    ? "opacity-50 cursor-not-allowed border-border bg-muted/20"
                    : isProximo
                      ? `${btn.bg} border cursor-pointer`
                      : "border-border bg-card cursor-pointer hover:bg-muted/20"
                    }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${registrado ? "bg-muted" : btn.bg.split(" ")[0]}`}>
                    {registrado ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : registrarMutation.isPending && isProximo ? (
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    ) : (
                      <btn.icon className={`w-5 h-5 ${btn.color}`} />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`font-medium text-sm ${registrado ? "text-muted-foreground line-through" : "text-foreground"}`}>
                      {btn.label}
                    </p>
                    {registrado && pontoHoje && (
                      <p className="text-xs text-muted-foreground">
                        Registado às {formatarHora(pontoHoje[{ ENTRADA: "horaEntrada", INICIO_ALMOCO: "horaInicioAlmoco", FIM_ALMOCO: "horaFimAlmoco", SAIDA: "horaSaida" }[btn.tipo] as keyof typeof pontoHoje] as any)}
                      </p>
                    )}
                  </div>
                  {isProximo && !registrado && (
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">Próximo</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={manualDialogOpen} onOpenChange={setManualDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registo de Ponto Manual</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de Registo</Label>
              <div className="grid grid-cols-2 gap-2">
                {BOTOES_PONTO.map((btn) => (
                  <Button
                    key={btn.tipo}
                    variant={manualTipo === btn.tipo ? "default" : "outline"}
                    className="justify-start gap-2 h-auto py-2 px-3"
                    onClick={() => setManualTipo(btn.tipo)}
                  >
                    <btn.icon className="w-4 h-4" />
                    <span className="text-xs">{btn.label}</span>
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hora">Horário</Label>
              <Input
                id="hora"
                type="time"
                value={manualTime}
                onChange={(e) => setManualTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="justificativa">Justificativa (opcional)</Label>
              <Textarea
                id="justificativa"
                placeholder="Por que está registando manualmente?"
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManualDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleManualSubmit}
              disabled={registrarMutation.isPending || !manualTipo || !manualTime}
            >
              {registrarMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Confirmar Registo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
