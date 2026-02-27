import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

const TIPO_LABELS: Record<string, string> = { ALARME: "Alarme", CAMERA: "Câmera", CERCA: "Cerca" };
const CAT_LABELS: Record<string, string> = { ALARME: "Alarme", CAMERA: "Câmera", CERCA: "Cerca", OUTROS: "Outros" };

export default function AdminRelatorioMateriais() {
  const { data: materiais, isLoading } = trpc.relatorios.materiais.useQuery({});

  return (
    <AppLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold text-foreground">Relatório de Materiais</h1>
          <p className="text-sm text-muted-foreground">Materiais utilizados por instalação</p>
        </div>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Materiais por OS
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {isLoading ? (
              <div className="p-6 text-center text-muted-foreground text-sm">A carregar...</div>
            ) : !materiais || materiais.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">Nenhum material registado.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">OS</th>
                    <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">Cliente</th>
                    <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">Tipo</th>
                    <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">Produto</th>
                    <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">Categoria</th>
                    <th className="text-center px-4 py-2 text-xs text-muted-foreground font-medium">Qtd</th>
                    <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">Unidade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {materiais.map((item: any) => (
                    <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2.5 font-medium text-foreground">
                        #{String(item.instalacaoId).padStart(5, "0")}
                      </td>
                      <td className="px-4 py-2.5 text-foreground">{item.clienteNome ?? "—"}</td>
                      <td className="px-4 py-2.5 text-foreground">{TIPO_LABELS[item.instalacaoTipo] ?? "—"}</td>
                      <td className="px-4 py-2.5 text-foreground">{item.produtoNome}</td>
                      <td className="px-4 py-2.5 text-foreground">{CAT_LABELS[item.categoria] ?? item.categoria}</td>
                      <td className="px-4 py-2.5 text-center font-medium text-foreground">{item.quantidade}</td>
                      <td className="px-4 py-2.5 text-foreground">{item.unidade}</td>
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
