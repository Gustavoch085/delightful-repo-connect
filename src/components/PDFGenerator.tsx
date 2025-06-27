
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import jsPDF from 'jspdf';

interface PDFGeneratorProps {
  budget: any;
  clientes: any[];
  disabled?: boolean;
}

export function PDFGenerator({ budget, clientes, disabled = false }: PDFGeneratorProps) {
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const generatePDF = async () => {
    const doc = new jsPDF();
    
    // Header com "orçamento detalhado"
    try {
      const headerImg = new Image();
      headerImg.crossOrigin = "anonymous";
      
      await new Promise((resolve, reject) => {
        headerImg.onload = () => {
          // Header "orçamento detalhado" - largura total
          doc.addImage(headerImg, 'PNG', 0, 0, 210, 20);
          resolve(true);
        };
        headerImg.onerror = reject;
        headerImg.src = '/lovable-uploads/16944181-86d9-4ae8-be5d-9b6782c41733.png';
      });
    } catch (error) {
      console.error('Erro ao carregar header:', error);
      // Fallback: criar header com texto
      doc.setFillColor(0, 0, 0);
      doc.rect(0, 0, 210, 20, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text('orçamento detalhado', 105, 12, { align: 'center' });
    }
    
    // Encontrar dados do cliente
    const cliente = clientes.find(c => c.name === budget.client_name);
    
    // Seção de informações do cliente
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    
    // CLIENTE e TELEFONE (lado esquerdo)
    doc.text('CLIENTE:', 20, 40);
    doc.text(budget.client_name || '', 20, 50);
    doc.text('TELEFONE:', 20, 60);
    doc.text(cliente?.telefone || '', 20, 70);
    
    // ENDEREÇO e BAIRRO/CIDADE (lado direito)
    doc.text('ENDEREÇO:', 120, 40);
    doc.text(cliente?.endereco || 'XXXXXX', 120, 50);
    doc.text('BAIRRO/CIDADE:', 120, 60);
    doc.text(`${cliente?.cidade || 'FORTALEZA'}-CE`, 120, 70);
    
    // Linha horizontal separadora
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1);
    doc.line(20, 80, 190, 80);
    
    // Cabeçalho da tabela
    doc.setFillColor(0, 0, 0);
    doc.rect(20, 90, 170, 15, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text('Nº', 25, 100);
    doc.text('Descrição do Produto', 45, 100);
    doc.text('Preço', 120, 100);
    doc.text('Qt.', 150, 100);
    doc.text('Total', 170, 100);
    
    // Itens da tabela
    doc.setTextColor(0, 0, 0);
    let yPosition = 115;
    let totalGeral = 0;
    
    if (budget.orcamento_items && budget.orcamento_items.length > 0) {
      budget.orcamento_items.forEach((item: any, index: number) => {
        const subtotal = item.quantity * parseFloat(item.price);
        totalGeral += subtotal;
        
        // Número do item
        doc.text((index + 1).toString(), 25, yPosition);
        
        // Nome do produto
        doc.text(item.product_name, 45, yPosition);
        
        // Preço unitário
        doc.text(`R$ ${formatCurrency(parseFloat(item.price))}`, 120, yPosition);
        
        // Quantidade
        doc.text(item.quantity.toString(), 155, yPosition);
        
        // Total do item
        doc.text(`R$ ${formatCurrency(subtotal)}`, 170, yPosition);
        
        yPosition += 15;
      });
    }
    
    // Espaçamento antes do total
    yPosition += 10;
    
    // Total final com fundo preto
    doc.setFillColor(0, 0, 0);
    doc.rect(150, yPosition - 5, 40, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text(`R$ ${formatCurrency(totalGeral)}`, 170, yPosition + 5, { align: 'center' });
    
    // Informações adicionais
    yPosition += 30;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text('Orçamento válido por: 15 dias', 20, yPosition);
    doc.text('Pagamento de 50% no ato do fechamento, restante do valor', 20, yPosition + 10);
    doc.text('na instalação do material.', 20, yPosition + 20);
    
    // Logo e CNPJ no rodapé
    try {
      const logoImg = new Image();
      logoImg.crossOrigin = "anonymous";
      
      await new Promise((resolve, reject) => {
        logoImg.onload = () => {
          // Logo no canto inferior esquerdo
          doc.addImage(logoImg, 'PNG', 20, 250, 60, 30);
          resolve(true);
        };
        logoImg.onerror = reject;
        logoImg.src = '/lovable-uploads/35e55213-9712-49dd-a567-4fd516d25498.png';
      });
    } catch (error) {
      console.error('Erro ao carregar logo:', error);
      // Fallback: criar retângulo preto com "logo 1"
      doc.setFillColor(0, 0, 0);
      doc.rect(20, 250, 60, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text('logo 1', 50, 270, { align: 'center' });
    }
    
    // CNPJ no canto inferior direito
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text('29.564.347.0001-49', 190, 270, { align: 'right' });
    
    // Salvar o PDF
    const fileName = `orcamento_detalhado_${budget.client_name.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;
    doc.save(fileName);
  };

  return (
    <Button
      onClick={generatePDF}
      disabled={disabled}
      size="sm"
      variant="outline"
      className="text-blue-400 border-blue-400 hover:bg-blue-400 hover:text-white"
    >
      <FileText className="h-4 w-4 mr-2" />
      Gerar PDF
    </Button>
  );
}
