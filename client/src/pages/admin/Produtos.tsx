import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Package, Search, Edit, Power, Loader2 } from "lucide-react";

const CATEGORIAS = ["ALARME", "CAMERA", "CERCA", "OUTROS"] as const;
const CAT_LABELS: Record<string, string> = { ALARME: "Alarme", CAMERA: "Câmera", CERCA: "Cerca", OUTROS: "Outros" };
const CAT_CLASSES: Record<string, string> = {
  ALARME: "badge-alarme", CAMERA: "badge-camera", CERCA: "badge-cerca", OUTROS: "bg-gray-500/20 text-gray-400 border border-gray-500/30",
};

type ProdutoForm = {
  id?: number;
  codigo: string; nome: string;
  categoria: "ALARME" | "CAMERA" | "CERCA" | "OUTROS";
  unidade: string; estoque: string;
};

const formVazio: ProdutoForm = { codigo: "", nome: "", categoria: "ALARME", unidade: "un", estoque: "0" };

export default function AdminProdutos() {
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("TODAS");
  const [modal, setModal] = useState<{ aberto: boolean; modo: "criar" | "editar" }>({ aberto: false, modo: "criar" });
  const [form, setForm] = useState<ProdutoForm>(formVazio);

  const { data: produtos, isLoading } = trpc.produtos.listar.useQuery({ categoria: filtroCategoria === "TODAS" ? undefined : filtroCategoria || undefined });
  const utils = trpc.useUtils();

  const criarMutation = trpc.produtos.criar.useMutation({
    onSuccess: () => {
      toast.success("Produto criado!");
      setModal({ aberto: false, modo: "criar" });
      setForm(formVazio);
      utils.produtos.listar.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const atualizarMutation = trpc.produtos.atualizar.useMutation({
    onSuccess: () => {
      toast.success("Produto atualizado!");
      setModal({ aberto: false, modo: "criar" });
      setForm(formVazio);
      utils.produtos.listar.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSalvar = () => {
    if (!form.nome) { toast.error("Nome é obrigatório."); return; }
    if (modal.modo === "criar") {
      criarMutation.mutate({ nome: form.nome, categoria: form.categoria, codigo: form.codigo || null, unidade: form.unidade, estoque: parseFloat(form.estoque) || 0 });
    } else {
      atualizarMutation.mutate({ id: form.id!, nome: form.nome, categoria: form.categoria, codigo: form.codigo || null, unidade: form.unidade, estoque: parseFloat(form.estoque) || 0 });
    }
  };

  const produtosFiltrados = produtos?.filter((p) =>
    !busca || p.nome.toLowerCase().includes(busca.toLowerCase()) || (p.codigo ?? "").toLowerCase().includes(busca.toLowerCase())
  ) ?? [];

  const isPending = criarMutation.isPending || atualizarMutation.isPending;

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">Produtos / Materiais</h1>
            <p className="text-sm text-muted-foreground">{produtosFiltrados.length} produto(s)</p>
          </div>
          <Button className="gap-2 w-full sm:w-auto" onClick={() => { setForm(formVazio); setModal({ aberto: true, modo: "criar" }); }}>
            <Plus className="w-4 h-4" /> Novo Produto
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-40">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Pesquisar produto..." className="pl-9 bg-input border-border h-9 text-sm" />
          </div>
          <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
            <SelectTrigger className="w-36 bg-input border-border text-sm h-9">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODAS">Todas</SelectItem>
              {CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{CAT_LABELS[c]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-card border border-border animate-pulse" />)}
          </div>
        ) : produtosFiltrados.length === 0 ? (
          <Card className="border-border">
            <CardContent className="py-12 text-center">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum produto encontrado.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {produtosFiltrados.map((produto) => (
              <div key={produto.id} className={`flex items-center gap-3 p-3 rounded-xl border border-border bg-card ${!produto.ativo ? "opacity-60" : ""}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm text-foreground">{produto.nome}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${CAT_CLASSES[produto.categoria]}`}>
                      {CAT_LABELS[produto.categoria]}
                    </span>
                    {!produto.ativo && <Badge variant="destructive" className="text-xs">Inativo</Badge>}
                  </div>
                  <div className="flex gap-3 mt-0.5">
                    {produto.codigo && <span className="text-xs text-muted-foreground">Cód: {produto.codigo}</span>}
                    <span className="text-xs text-muted-foreground">Estoque: {produto.estoque} {produto.unidade}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setForm({ id: produto.id, codigo: produto.codigo ?? "", nome: produto.nome, categoria: produto.categoria as any, unidade: produto.unidade ?? "un", estoque: String(produto.estoque ?? 0) });
                      setModal({ aberto: true, modo: "editar" });
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`w-8 h-8 ${produto.ativo ? "text-red-400 hover:text-red-300" : "text-green-400 hover:text-green-300"}`}
                    onClick={() => atualizarMutation.mutate({ id: produto.id, ativo: !produto.ativo })}
                  >
                    <Power className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal criar/editar */}
      <Dialog open={modal.aberto} onOpenChange={(o) => { if (!o) { setModal({ aberto: false, modo: "criar" }); setForm(formVazio); } }}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle>{modal.modo === "criar" ? "Novo Produto" : "Editar Produto"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs text-muted-foreground mb-1">Nome *</Label>
              <Input value={form.nome} onChange={set("nome")} className="bg-input border-border" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1">Categoria</Label>
                <Select value={form.categoria} onValueChange={(v) => setForm((f) => ({ ...f, categoria: v as any }))}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{CAT_LABELS[c]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1">Código</Label>
                <Input value={form.codigo} onChange={set("codigo")} className="bg-input border-border" placeholder="Ex: ALR-001" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1">Unidade</Label>
                <Input value={form.unidade} onChange={set("unidade")} className="bg-input border-border" placeholder="un, m, kg..." />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1">Estoque</Label>
                <Input type="number" value={form.estoque} onChange={set("estoque")} className="bg-input border-border" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setModal({ aberto: false, modo: "criar" }); setForm(formVazio); }}>Cancelar</Button>
            <Button onClick={handleSalvar} disabled={isPending} className="gap-2">
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {modal.modo === "criar" ? "Criar" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
