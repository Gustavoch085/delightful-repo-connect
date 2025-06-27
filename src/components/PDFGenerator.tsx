
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
    
    // Cabeçalho com logo da empresa (primeira imagem)
    try {
      const headerImg = new Image();
      headerImg.crossOrigin = "anonymous";
      
      await new Promise((resolve, reject) => {
        headerImg.onload = () => {
          // Logo da empresa no canto superior esquerdo
          doc.addImage(headerImg, 'PNG', 20, 15, 50, 25);
          resolve(true);
        };
        headerImg.onerror = reject;
        headerImg.src = '/lovable-uploads/586eb785-4d5c-4a24-b468-92bfef4d56cb.png';
      });
    } catch (error) {
      console.error('Erro ao carregar logo da empresa:', error);
    }
    
    // Informações da empresa no cabeçalho
    doc.setTextColor(0, 200, 200); // Cor ciano
    doc.setFontSize(18);
    doc.text('FORTAL SOLUÇÕES', 130, 25);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text('CNPJ: 29.564.347/0001-49', 130, 32);
    doc.text('RUA ERNESTO PEDRO DOS SANTOS, 66 - JOQUEI', 130, 38);
    
    // Encontrar dados do cliente
    const cliente = clientes.find(c => c.name === budget.client_name);
    
    // Informações do cliente
    doc.setTextColor(0, 200, 200); // Cor ciano
    doc.setFontSize(14);
    doc.text(budget.client_name?.toUpperCase() || '', 20, 65);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`(${cliente?.phone || ''}) - ${budget.client_name || ''}`, 20, 72);
    
    // Cabeçalho da tabela
    doc.setFillColor(0, 150, 150); // Cor ciano escuro
    doc.rect(20, 85, 170, 12, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text('QUANT', 30, 93);
    doc.text('ITEM / DESCRIÇÃO', 70, 93);
    doc.text('UNIT', 140, 93);
    doc.text('TOTAL', 170, 93);
    
    // Itens da tabela
    doc.setTextColor(0, 0, 0);
    let yPosition = 105;
    let totalGeral = 0;
    
    if (budget.orcamento_items && budget.orcamento_items.length > 0) {
      budget.orcamento_items.forEach((item: any, index: number) => {
        const subtotal = item.quantity * parseFloat(item.price);
        totalGeral += subtotal;
        
        // Alternar cores das linhas
        if (index % 2 === 0) {
          doc.setFillColor(240, 240, 240);
          doc.rect(20, yPosition - 5, 170, 12, 'F');
        }
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        
        // Quantidade (centralizada)
        doc.text(String(item.quantity).padStart(2, '0'), 35, yPosition);
        
        // Nome do produto
        doc.text(item.product_name, 25, yPosition);
        
        // Preço unitário
        doc.text(`R$${formatCurrency(parseFloat(item.price))}`, 140, yPosition);
        
        // Total do item
        doc.text(`R$${formatCurrency(subtotal)}`, 170, yPosition);
        
        yPosition += 12;
      });
    }
    
    // Total final
    yPosition += 10;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(`TOTAL : R$${formatCurrency(totalGeral)}`, 150, yPosition);
    
    // Informações de pagamento
    yPosition += 20;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text('Formas de Pagamento:', 20, yPosition);
    doc.text('50% Para início da produção / 50% Ao Concluir-Receber', 20, yPosition + 8);
    
    doc.text('Prazos:', 20, yPosition + 20);
    doc.text('A Combinar', 20, yPosition + 28);
    
    doc.text('Logística:', 20, yPosition + 40);
    doc.text('Instalado', 20, yPosition + 48);
    
    doc.text('Endereço de Instalação:', 20, yPosition + 60);
    doc.text(`${cliente?.address || 'Av. III, 626, Jereissati I - Maracanaú'}`, 20, yPosition + 68);
    
    // Rodapé com informações da diretora e logo
    doc.setFontSize(10);
    doc.text('JENIFFER LEITE - (85) 98676.1518', 105, 250, { align: 'center' });
    doc.text('DIRETORA COMERCIAL', 105, 258, { align: 'center' });
    
    // Logo no rodapé
    try {
      const logoImg = new Image();
      logoImg.crossOrigin = "anonymous";
      
      await new Promise((resolve, reject) => {
        logoImg.onload = () => {
          doc.addImage(logoImg, 'PNG', 95, 265, 20, 20);
          resolve(true);
        };
        logoImg.onerror = reject;
        logoImg.src = '/lovable-uploads/c3a950dc-98b6-4517-8005-7942f1bdbbf6.png';
      });
    } catch (error) {
      console.error('Erro ao carregar logo do rodapé:', error);
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
