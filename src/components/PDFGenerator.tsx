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
    
    // Cores do design
    const cyanBlue = [0, 200, 255]; // Azul ciano principal
    const darkBlue = [0, 51, 102]; // Azul escuro
    const black = [0, 0, 0];
    const white = [255, 255, 255];
    const lightGray = [245, 245, 245];
    const tableRowGray = [220, 220, 220]; // Cinza claro para linhas
    const headerTextColor = [25, 255, 245]; // Nova cor para texto do cabeçalho #19fff5
    
    // Background branco
    doc.setFillColor(white[0], white[1], white[2]);
    doc.rect(0, 0, 210, 297, 'F');
    
    // Elemento geométrico superior esquerdo (triângulo preto)
    doc.setFillColor(black[0], black[1], black[2]);
    doc.triangle(0, 0, 0, 40, 40, 0, 'F');
    
    // Nova imagem do cabeçalho ocupando toda a largura
    try {
      const headerImg = new Image();
      headerImg.crossOrigin = "anonymous";
      
      await new Promise((resolve, reject) => {
        headerImg.onload = () => {
          // Adicionar imagem ocupando toda a largura (210mm) e altura proporcional
          doc.addImage(headerImg, 'PNG', 0, 15, 210, 60);
          resolve(true);
        };
        headerImg.onerror = reject;
        headerImg.src = '/lovable-uploads/f8f1f6c6-463a-4380-8f7a-ade48cfda7bc.png';
      });
    } catch (error) {
      console.error('Erro ao carregar imagem do cabeçalho:', error);
    }
    
    // Encontrar dados do cliente
    const cliente = clientes.find(c => c.name === budget.client_name);
    
    // Espaço antes da tabela (ajustado para dar espaço para a nova imagem)
    let yPos = 90;
    
    // Dimensões da tabela
    const tableStartX = 20;
    const tableWidth = 170;
    const rowHeight = 12;
    
    // Larguras das colunas baseadas na imagem
    const colWidths = [25, 85, 30, 30]; // QUANT, ITEM/DESCRIÇÃO, UNIT, TOTAL
    
    // Cabeçalho da tabela com fundo preto
    doc.setFillColor(black[0], black[1], black[2]);
    doc.rect(tableStartX, yPos, tableWidth, rowHeight, 'F');
    
    // Bordas do cabeçalho - mudando para branco
    doc.setDrawColor(white[0], white[1], white[2]);
    doc.setLineWidth(0.5);
    
    // Linhas verticais do cabeçalho
    let currentX = tableStartX;
    for (let i = 0; i <= colWidths.length; i++) {
      doc.line(currentX, yPos, currentX, yPos + rowHeight);
      if (i < colWidths.length) currentX += colWidths[i];
    }
    
    // Linhas horizontais do cabeçalho
    doc.line(tableStartX, yPos, tableStartX + tableWidth, yPos);
    doc.line(tableStartX, yPos + rowHeight, tableStartX + tableWidth, yPos + rowHeight);
    
    // Texto do cabeçalho da tabela - cor #19fff5
    doc.setTextColor(headerTextColor[0], headerTextColor[1], headerTextColor[2]);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    
    // Posicionar texto centrado nas colunas
    doc.text('QUANT', tableStartX + colWidths[0]/2, yPos + 8, { align: 'center' });
    doc.text('ITEM / DESCRIÇÃO', tableStartX + colWidths[0] + colWidths[1]/2, yPos + 8, { align: 'center' });
    doc.text('UNIT', tableStartX + colWidths[0] + colWidths[1] + colWidths[2]/2, yPos + 8, { align: 'center' });
    doc.text('TOTAL', tableStartX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3]/2, yPos + 8, { align: 'center' });
    
    // Linhas da tabela
    yPos += rowHeight;
    let totalGeral = 0;
    
    if (budget.orcamento_items && budget.orcamento_items.length > 0) {
      budget.orcamento_items.forEach((item: any, index: number) => {
        const subtotal = item.quantity * parseFloat(item.price);
        totalGeral += subtotal;
        
        // Fundo alternado para as linhas (cinza claro)
        doc.setFillColor(tableRowGray[0], tableRowGray[1], tableRowGray[2]);
        doc.rect(tableStartX, yPos, tableWidth, rowHeight, 'F');
        
        // Bordas da linha - mudando para branco
        doc.setDrawColor(white[0], white[1], white[2]);
        doc.setLineWidth(0.5);
        
        // Linhas verticais
        currentX = tableStartX;
        for (let i = 0; i <= colWidths.length; i++) {
          doc.line(currentX, yPos, currentX, yPos + rowHeight);
          if (i < colWidths.length) currentX += colWidths[i];
        }
        
        // Linha horizontal inferior
        doc.line(tableStartX, yPos + rowHeight, tableStartX + tableWidth, yPos + rowHeight);
        
        doc.setTextColor(black[0], black[1], black[2]);
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        
        // Quantidade centralizada
        doc.text(String(item.quantity).padStart(2, '0'), tableStartX + colWidths[0]/2, yPos + 8, { align: 'center' });
        
        // Nome do produto (alinhado à esquerda)
        doc.text(item.product_name, tableStartX + colWidths[0] + 3, yPos + 8);
        
        // Preço unitário (centralizado)
        doc.text(`R$${formatCurrency(parseFloat(item.price))}`, tableStartX + colWidths[0] + colWidths[1] + colWidths[2]/2, yPos + 8, { align: 'center' });
        
        // Total do item (centralizado)
        doc.text(`R$${formatCurrency(subtotal)}`, tableStartX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3]/2, yPos + 8, { align: 'center' });
        
        yPos += rowHeight;
      });
    }
    
    // Linha do total final
    yPos += 5;
    
    // Fundo da linha de total
    doc.setFillColor(tableRowGray[0], tableRowGray[1], tableRowGray[2]);
    doc.rect(tableStartX + colWidths[0] + colWidths[1], yPos, colWidths[2] + colWidths[3], rowHeight, 'F');
    
    // Bordas da linha de total - mudando para branco
    doc.setDrawColor(white[0], white[1], white[2]);
    doc.setLineWidth(0.5);
    doc.rect(tableStartX + colWidths[0] + colWidths[1], yPos, colWidths[2] + colWidths[3], rowHeight);
    
    // Linha vertical separando TOTAL: do valor
    doc.line(tableStartX + colWidths[0] + colWidths[1] + colWidths[2], yPos, tableStartX + colWidths[0] + colWidths[1] + colWidths[2], yPos + rowHeight);
    
    // Texto do total
    doc.setTextColor(black[0], black[1], black[2]);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('TOTAL :', tableStartX + colWidths[0] + colWidths[1] + colWidths[2]/2, yPos + 8, { align: 'center' });
    doc.text(`R$${formatCurrency(totalGeral)}`, tableStartX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3]/2, yPos + 8, { align: 'center' });
    
    // Seção de condições de pagamento - ajustando os espaçamentos
    yPos += 20;
    
    doc.setTextColor(black[0], black[1], black[2]);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Formas de Pagamento:', 20, yPos);
    
    yPos += 6; // Espaçamento entre título e conteúdo
    doc.setFont(undefined, 'normal');
    doc.text('50% Para início da produção / 50% Ao Concluir-Receber', 20, yPos);
    
    yPos += 12; // Espaçamento entre seções
    doc.setFont(undefined, 'bold');
    doc.text('Prazos:', 20, yPos);
    yPos += 6; // Espaçamento entre título e conteúdo
    doc.setFont(undefined, 'normal');
    doc.text('A Combinar', 20, yPos);
    
    yPos += 12; // Espaçamento entre seções
    doc.setFont(undefined, 'bold');
    doc.text('Logística:', 20, yPos);
    yPos += 6; // Espaçamento entre título e conteúdo
    doc.setFont(undefined, 'normal');
    doc.text('Instalado', 20, yPos);
    
    yPos += 12; // Espaçamento entre seções
    doc.setFont(undefined, 'bold');
    doc.text('Endereço de Instalação:', 20, yPos);
    yPos += 6; // Espaçamento entre título e conteúdo
    doc.setFont(undefined, 'normal');
    doc.text(cliente?.address || 'Av. III, 626, Jereissati I - Maracanaú', 20, yPos);
    
    // Nova imagem do rodapé ocupando toda a largura
    try {
      const footerImg = new Image();
      footerImg.crossOrigin = "anonymous";
      
      await new Promise((resolve, reject) => {
        footerImg.onload = () => {
          // Adicionar imagem do rodapé ocupando toda a largura na parte inferior
          doc.addImage(footerImg, 'PNG', 0, 220, 210, 77);
          resolve(true);
        };
        footerImg.onerror = reject;
        footerImg.src = '/lovable-uploads/78afa8c5-b443-4e20-bdc9-c8265b303094.png';
      });
    } catch (error) {
      console.error('Erro ao carregar imagem do rodapé:', error);
    }
    
    // Salvar o PDF
    const fileName = `orcamento_${budget.client_name.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;
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
