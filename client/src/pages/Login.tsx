import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";
import { Shield, Lock, Mail, Eye, EyeOff } from "lucide-react";

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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Fundo decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo e título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4 text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.2)]">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">INVIOLÁVEL</h1>
          <p className="text-muted-foreground mt-1 text-sm tracking-widest uppercase">Monitoramento Eletrônico</p>
        </div>

        <Card className="border-border shadow-2xl">
          <CardHeader className="pb-4 pt-6 px-6">
            <h2 className="text-xl font-semibold text-foreground">Entrar na conta</h2>
            <p className="text-sm text-muted-foreground">Acesso restrito a colaboradores autorizados</p>
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
