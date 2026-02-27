import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Search, UserCircle, Phone, MapPin, FileText, ChevronRight, Trash2 } from "lucide-react";

export default function AdminClientes() {
  const [busca, setBusca] = useState("");
  const [, navigate] = useLocation();

  const { data: clientes, isLoading, refetch } = trpc.clientes.listar.useQuery(
    { busca: busca || undefined },
    { refetchOnWindowFocus: false }
  );

  const excluirMutation = trpc.clientes.excluir.useMutation({
    onSuccess: () => {
      toast.success("Cliente excluído com sucesso!");
      refetch();
    },
    onError: (err) => toast.error("Erro ao excluir: " + err.message),
  });

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">Clientes</h1>
            <p className="text-sm text-muted-foreground">{clientes?.length ?? 0} cliente(s) cadastrado(s)</p>
          </div>
          <Link href="/admin/clientes/novo">
            <Button className="gap-2 w-full sm:w-auto">
              <Plus className="w-4 h-4" /> Novo Cliente
            </Button>
          </Link>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por nome, CPF/CNPJ..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9 bg-input border-border"
          />
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-card border border-border animate-pulse" />
            ))}
          </div>
        ) : clientes?.length === 0 ? (
          <Card className="border-border">
            <CardContent className="py-12 text-center">
              <UserCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum cliente encontrado.</p>
              <Link href="/admin/clientes/novo">
                <Button variant="outline" className="mt-4 gap-2">
                  <Plus className="w-4 h-4" /> Cadastrar primeiro cliente
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {clientes?.map((cliente) => (
              <Link key={cliente.id} href={`/admin/clientes/${cliente.id}`}>
                <a className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-muted/20 transition-all">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <UserCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground truncate">{cliente.nomeRazao}</p>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground flex-shrink-0">
                        {cliente.tipo}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      {cliente.telefone1 && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="w-3 h-3" /> {cliente.telefone1}
                        </span>
                      )}
                      {cliente.cidade && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" /> {cliente.cidade}/{cliente.uf}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 text-muted-foreground hover:text-red-400"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (confirm(`Tem certeza que deseja excluir permanetemente o cliente ${cliente.nomeRazao}? Todas as suas OS e fichas também serão apagadas.`)) {
                          excluirMutation.mutate({ id: cliente.id });
                        }
                      }}
                      disabled={excluirMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </div>
                </a>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
