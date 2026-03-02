import PDFDocument from "pdfkit";
import { storagePut } from "../storage";
import type { Cliente } from "../../drizzle/schema";
import { buscarUltimaInstalacaoPorCliente } from "../db";

function formatarData(data: Date | string | null | undefined): string {
  if (!data) return "—";
  const d = typeof data === "string" ? new Date(data) : data;
  return d.toLocaleDateString("pt-BR");
}

const THEME_COLOR = "#000000"; // Preto elegante para cabeçalhos
const ACCENT_COLOR = "#FBBF24"; // Amarelo vibrante Inviolável (oklch 0.84 0.22 85)
const TEXT_COLOR = "#333333";
export async function gerarFichaClientePDF(cliente: Cliente): Promise<{ arquivoPath: string; arquivoUrl: string }> {
  const ultimaOS = await buscarUltimaInstalacaoPorCliente(cliente.id);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("error", reject);
    doc.on("end", async () => {
      try {
        const buffer = Buffer.concat(chunks);
        const timestamp = Date.now();
        const fileKey = `fichas-clientes/cliente-${cliente.id}-${timestamp}.pdf`;
        const { url } = await storagePut(fileKey, buffer, "application/pdf");
        resolve({ arquivoPath: fileKey, arquivoUrl: url });
      } catch (err) {
        reject(err);
      }
    });

    // Função auxiliar para desenhar cabeçalhos de seção
    const sectionHeader = (title: string, subtitle?: string) => {
      doc.moveDown(0.8);
      const y = doc.y;
      doc.rect(40, y, doc.page.width - 80, 20).fill(THEME_COLOR);
      doc.fillColor(ACCENT_COLOR).fontSize(10).font("Helvetica-Bold").text(title, 55, y + 5);
      if (subtitle) {
        doc.fillColor("#999999").fontSize(8).font("Helvetica").text(subtitle, doc.page.width - 250, y + 6, { align: "right", width: 200 });
      }
      doc.fillColor(TEXT_COLOR);
      doc.y = y + 30;
    };

    // ─── Cabeçalho ────────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 85).fill(THEME_COLOR);
    doc.fillColor(ACCENT_COLOR).fontSize(26).font("Helvetica-Bold").text("INVIOLÁVEL", 40, 20);
    doc.fillColor("#ffffff").fontSize(11).font("Helvetica").text("Monitoramento Eletrônico", 195, 33);
    doc.fillColor(ACCENT_COLOR).fontSize(10).text("FICHA DE CADASTRO COMPLETA", 350, 35, { align: "right", width: 200 });

    doc.moveDown(3);
    doc.fillColor("#666666").fontSize(8).font("Helvetica").text(`Emissão: ${new Date().toLocaleString("pt-BR")}   |   ID: #${cliente.id}`, { align: "right" });

    // ─── Bloco A: Ficha da Central e Contrato ─────────────────────────────
    sectionHeader("A — CONTRATO E CENTRAL");
    doc.fontSize(9).font("Helvetica");

    const col1 = 40, col2 = 180, col3 = 320, col4 = 440;
    let currentY = doc.y;

    doc.text(`Cliente Novo: ${cliente.clienteNovo === 1 ? "SIM" : "NÃO"}`, col1, currentY);
    doc.text(`Código: ${cliente.codigo || "—"}`, col2, currentY);
    doc.text(`Modelo: ${cliente.modeloCentral || "—"}`, col3, currentY);
    doc.text(`Contrato: ${cliente.tipoContrato || "—"}`, col4, currentY);

    currentY += 15;
    doc.text(`Data Cadastro: ${cliente.dataCadastro || "—"}`, col1, currentY);
    doc.text(`Data Instalação: ${cliente.dataInstalacao || "—"}`, col2, currentY);
    doc.text(`Vendedor: ${cliente.nomeVendedor || "—"}`, col3, currentY);
    doc.text(`Instalador: ${cliente.nomeInstalador || "—"}`, col4, currentY);

    doc.y = currentY + 15;

    // ─── Bloco B: Identificação do Cliente ───────────────────────────────
    sectionHeader("B — DADOS DO CLIENTE");
    doc.fontSize(9);
    doc.font("Helvetica-Bold").text(`Razão Social: `, { continued: true }).font("Helvetica").text(cliente.nomeRazao || "—");
    if (cliente.nomeFantasia) {
      doc.font("Helvetica-Bold").text(`Nome Fantasia: `, { continued: true }).font("Helvetica").text(cliente.nomeFantasia);
    }

    const docLabel = cliente.tipo === "PJ" ? "CNPJ" : "CPF";
    doc.text(`${docLabel}: ${cliente.cpfCnpj || "—"}      RG/IE: ${cliente.rgIe || "—"}`);
    doc.text(`Atividade: ${cliente.ramoAtividade || "—"}      Nasc: ${formatarData(cliente.nascimento)}`);

    doc.moveDown(0.5);
    doc.fillColor(THEME_COLOR).font("Helvetica-Bold").text("ENDEREÇO E CONTATO DA CENTRAL");
    doc.fillColor("#333333").font("Helvetica");
    doc.text(`Endereço: ${cliente.rua || "—"}, ${cliente.numero || "s/n"} - ${cliente.bairro || "—"}`);
    doc.text(`Proximidade: ${cliente.proximidade || "—"}      Rota: ${cliente.rota || "—"}`);
    doc.text(`Cidade/UF: ${cliente.cidade || "—"} / ${cliente.uf || "—"}      CEP: ${cliente.cep || "—"}`);
    doc.text(`Telefone: ${cliente.telefone1 || "—"}      WhatsApp: ${cliente.whatsapp || "—"}      E-mail: ${cliente.email || "—"}`);

    // ─── Bloco C: Responsável Legal ──────────────────────────────────────
    sectionHeader("C — RESPONSÁVEL LEGAL");
    doc.text(`Nome: ${cliente.responsavelNome || "—"}      CPF: ${cliente.responsavelCpf || "—"}`);
    doc.text(`Endereço: ${cliente.responsavelEndereco || "—"}, ${cliente.responsavelNumero || "—"} - ${cliente.responsavelBairro || "—"}`);
    doc.text(`Cidade/UF: ${cliente.responsavelCidade || "—"} / ${cliente.responsavelEstado || "—"}`);

    // ─── Bloco D: Ficha Técnica (Zonas e Usuários) ────────────────────────
    if (ultimaOS && (ultimaOS.zonas || ultimaOS.usuarios)) {
      sectionHeader("D — FICHA TÉCNICA (ZONAS E USUÁRIOS)");
      const yFicha = doc.y;

      // Zonas (Coluna Esquerda)
      doc.fillColor(THEME_COLOR).font("Helvetica-Bold").text("ZONAS / SETORES", 40, yFicha);
      doc.moveDown(0.3);
      doc.fillColor("#333333").font("Helvetica").fontSize(8);

      let zonasArr: any[] = [];
      try { zonasArr = typeof ultimaOS.zonas === 'string' ? JSON.parse(ultimaOS.zonas || '[]') : (ultimaOS.zonas as any[] || []); } catch (e) { }

      if (Array.isArray(zonasArr) && zonasArr.length > 0) {
        zonasArr.slice(0, 30).forEach(z => {
          doc.text(`Zona ${z.numero || "—"}: ${z.local || "—"}`);
        });
      } else {
        doc.text("Nenhuma zona cadastrada.");
      }

      // Usuários (Coluna Direita)
      const currentYAfterZonas = doc.y;
      doc.fillColor(THEME_COLOR).font("Helvetica-Bold").text("USUÁRIOS CENTRAL", 300, yFicha);
      doc.moveDown(0.3);
      doc.fillColor("#333333").font("Helvetica").fontSize(8);

      let usersArr: any[] = [];
      try { usersArr = typeof ultimaOS.usuarios === 'string' ? JSON.parse(ultimaOS.usuarios || '[]') : (ultimaOS.usuarios as any[] || []); } catch (e) { }

      if (Array.isArray(usersArr) && usersArr.length > 0) {
        usersArr.slice(0, 30).forEach(u => {
          doc.text(`User ${u.numero || "—"}: ${u.nome || "—"}`, 300, doc.y);
        });
      } else {
        doc.text("Nenhum usuário cadastrado.", 300);
      }

      // Ajusta Y para o maior das duas colunas
      doc.y = Math.max(doc.y, currentYAfterZonas) + 10;
    }

    // ─── Assinaturas ──────────────────────────────────────────────────────
    doc.moveDown(2);
    if (doc.y > doc.page.height - 120) doc.addPage();

    const assinaturaY = doc.page.height - 100;
    doc.strokeColor("#999999").lineWidth(0.5);
    doc.moveTo(40, assinaturaY).lineTo(250, assinaturaY).stroke();
    doc.moveTo(330, assinaturaY).lineTo(doc.page.width - 40, assinaturaY).stroke();

    doc.fillColor("#666666").fontSize(8).font("Helvetica").text("Assinatura do Cliente", 40, assinaturaY + 5, { width: 210, align: "center" });
    doc.text("Responsável Inviolável / Técnico", 330, assinaturaY + 5, { width: 220, align: "center" });

    // ─── Rodapé ───────────────────────────────────────────────────────────
    doc.fontSize(7).fillColor("#999999").text("INVIOLÁVEL — Monitoramento Eletrônico e Segurança de Alta Tecnologia", 40, doc.page.height - 30, { align: "center", width: doc.page.width - 80 });

    doc.end();
  });
}
