import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [, navigate] = useLocation();
  const { refetch, isAuthenticated, isAdmin } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const loginMutation = trpc.inviolavel.login.useMutation({
    onSuccess: async (data) => {
      toast.success(`Bem-vindo, ${data.nome}!`);
      // Use window.location.href to prevent pure React-router race conditions
      if (data.perfil === "ADMIN") {
        window.location.href = "/admin/dashboard";
      } else {
        window.location.href = "/app/dashboard";
      }
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao fazer login.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !senha) {
      toast.error("Preencha o e-mail e a senha.");
      return;
    }
    loginMutation.mutate({ email: cleanEmail, senha });
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Premium background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] opacity-50" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-[80px]" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-[80px]" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Logo e título */}
        <div className="text-center mb-10">
          <Logo size="lg" className="mb-2 text-white" />
          <p className="text-muted-foreground mt-2 text-xs tracking-[0.3em] font-medium uppercase opacity-60">Monitoramento Eletrônico</p>
        </div>

        <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-xl shadow-2xl shadow-black/50">
          <CardHeader className="pb-4 pt-8 px-8 border-b border-white/5">
            <h2 className="text-xl font-bold text-foreground">Acesso ao Sistema</h2>
            <p className="text-sm text-muted-foreground mt-1">Identifique-se para gerenciar seus levantamentos e instalações.</p>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-input border-border"
                    autoComplete="email"
                    disabled={loginMutation.isPending}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="senha" className="text-sm font-medium">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="senha"
                    type={mostrarSenha ? "text" : "password"}
                    placeholder="••••••••"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="pl-10 pr-10 bg-input border-border"
                    autoComplete="current-password"
                    disabled={loginMutation.isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full font-semibold h-11"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "A entrar..." : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()} INVIOLÁVEL — Todos os direitos reservados
        </p>
      </div>
    </div>
  );
}
