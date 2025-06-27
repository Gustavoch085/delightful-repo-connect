
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
    
    // Background branco
    doc.setFillColor(white[0], white[1], white[2]);
    doc.rect(0, 0, 210, 297, 'F');
    
    // Elemento geométrico superior esquerdo (triângulo preto)
    doc.setFillColor(black[0], black[1], black[2]);
    doc.triangle(0, 0, 0, 40, 40, 0, 'F');
    
    // Logo da empresa no canto superior esquerdo
    try {
      const logoImg = new Image();
      logoImg.crossOrigin = "anonymous";
      
      await new Promise((resolve, reject) => {
        logoImg.onload = () => {
          doc.addImage(logoImg, 'PNG', 15, 15, 30, 20);
          resolve(true);
        };
        logoImg.onerror = reject;
        logoImg.src = '/lovable-uploads/586eb785-4d5c-4a24-b468-92bfef4d56cb.png';
      });
    } catch (error) {
      console.error('Erro ao carregar logo da empresa:', error);
    }
    
    // Título "FORTAL SOLUÇÕES" no cabeçalho direito
    doc.setTextColor(cyanBlue[0], cyanBlue[1], cyanBlue[2]);
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('FORTAL SOLUÇÕES', 130, 25);
    
    // Informações da empresa
    doc.setTextColor(black[0], black[1], black[2]);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('CNPJ: 29.564.347/0001-49', 130, 35);
    doc.text('RUA ERNESTO PEDRO DOS SANTOS, 66 - JOQUEI', 130, 42);
    
    // Encontrar dados do cliente
    const cliente = clientes.find(c => c.name === budget.client_name);
    
    // Seção do cliente (posicionada à esquerda)
    let yPos = 80;
    doc.setTextColor(cyanBlue[0], cyanBlue[1], cyanBlue[2]);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text(budget.client_name?.toUpperCase() || 'CLIENTE', 20, yPos);
    
    // Telefone do cliente
    yPos += 10;
    doc.setTextColor(black[0], black[1], black[2]);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`(${cliente?.phone || '85) 00000-0000'}) - ${budget.client_name || 'Cliente'}`, 20, yPos);
    
    // Espaço antes da tabela
    yPos += 30;
    
    // Cabeçalho da tabela com fundo escuro
    doc.setFillColor(darkBlue[0], darkBlue[1], darkBlue[2]);
    doc.rect(20, yPos, 170, 12, 'F');
    
    // Texto do cabeçalho da tabela
    doc.setTextColor(cyanBlue[0], cyanBlue[1], cyanBlue[2]);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('QUANT', 30, yPos + 8);
    doc.text('ITEM / DESCRIÇÃO', 70, yPos + 8);
    doc.text('UNIT', 150, yPos + 8);
    doc.text('TOTAL', 175, yPos + 8);
    
    // Linhas da tabela
    yPos += 12;
    let totalGeral = 0;
    
    if (budget.orcamento_items && budget.orcamento_items.length > 0) {
      budget.orcamento_items.forEach((item: any, index: number) => {
        const subtotal = item.quantity * parseFloat(item.price);
        totalGeral += subtotal;
        
        // Fundo alternado para as linhas
        if (index % 2 === 0) {
          doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
          doc.rect(20, yPos, 170, 12, 'F');
        }
        
        // Bordas da tabela
        doc.setDrawColor(200, 200, 200);
        doc.rect(20, yPos, 170, 12);
        
        doc.setTextColor(black[0], black[1], black[2]);
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        
        // Quantidade centralizada
        doc.text(String(item.quantity).padStart(2, '0'), 32, yPos + 8);
        
        // Nome do produto
        doc.text(item.product_name, 25, yPos + 8);
        
        // Preço unitário
        doc.text(`R$${formatCurrency(parseFloat(item.price))}`, 145, yPos + 8);
        
        // Total do item
        doc.text(`R$${formatCurrency(subtotal)}`, 175, yPos + 8);
        
        yPos += 12;
      });
    }
    
    // Total final em destaque
    yPos += 10;
    doc.setTextColor(black[0], black[1], black[2]);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`TOTAL :`, 140, yPos);
    doc.text(`R$${formatCurrency(totalGeral)}`, 175, yPos);
    
    // Seção de condições de pagamento
    yPos += 20;
    
    doc.setTextColor(black[0], black[1], black[2]);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Formas de Pagamento:', 20, yPos);
    
    yPos += 8;
    doc.setFont(undefined, 'normal');
    doc.text('50% Para início da produção / 50% Ao Concluir-Receber', 20, yPos);
    
    yPos += 10;
    doc.setFont(undefined, 'bold');
    doc.text('Prazos:', 20, yPos);
    yPos += 8;
    doc.setFont(undefined, 'normal');
    doc.text('A Combinar', 20, yPos);
    
    yPos += 10;
    doc.setFont(undefined, 'bold');
    doc.text('Logística:', 20, yPos);
    yPos += 8;
    doc.setFont(undefined, 'normal');
    doc.text('Instalado', 20, yPos);
    
    yPos += 10;
    doc.setFont(undefined, 'bold');
    doc.text('Endereço de Instalação:', 20, yPos);
    yPos += 8;
    doc.setFont(undefined, 'normal');
    doc.text(cliente?.address || 'Av. III, 626, Jereissati I - Maracanaú', 20, yPos);
    
    // Elementos geométricos no rodapé
    const footerY = 250;
    
    // Triângulo preto inferior direito
    doc.setFillColor(black[0], black[1], black[2]);
    doc.triangle(210, 297, 210, 250, 160, 297, 'F');
    
    // Triângulo ciano no canto inferior direito
    doc.setFillColor(cyanBlue[0], cyanBlue[1], cyanBlue[2]);
    doc.triangle(210, 297, 190, 297, 210, 277, 'F');
    
    // Informações da diretora comercial centralizadas
    doc.setTextColor(black[0], black[1], black[2]);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('JENIFFER LEITE - (85) 98676.1518', 105, footerY + 20, { align: 'center' });
    doc.setFont(undefined, 'bold');
    doc.text('DIRETORA COMERCIAL', 105, footerY + 28, { align: 'center' });
    
    // Logo centralizada no rodapé
    try {
      const footerLogoImg = new Image();
      footerLogoImg.crossOrigin = "anonymous";
      
      await new Promise((resolve, reject) => {
        footerLogoImg.onload = () => {
          doc.addImage(footerLogoImg, 'PNG', 95, footerY + 35, 20, 15);
          resolve(true);
        };
        footerLogoImg.onerror = reject;
        footerLogoImg.src = '/lovable-uploads/c3a950dc-98b6-4517-8005-7942f1bdbbf6.png';
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
