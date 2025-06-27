
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
    
    // Configurar cores
    const primaryBlue = [41, 128, 185]; // Azul principal
    const darkBlue = [52, 73, 94]; // Azul escuro
    const lightGray = [236, 240, 241]; // Cinza claro
    
    // Cabeçalho com fundo azul
    doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    doc.rect(0, 0, 210, 60, 'F');
    
    // Logo da empresa no cabeçalho
    try {
      const headerImg = new Image();
      headerImg.crossOrigin = "anonymous";
      
      await new Promise((resolve, reject) => {
        headerImg.onload = () => {
          doc.addImage(headerImg, 'PNG', 15, 15, 40, 30);
          resolve(true);
        };
        headerImg.onerror = reject;
        headerImg.src = '/lovable-uploads/586eb785-4d5c-4a24-b468-92bfef4d56cb.png';
      });
    } catch (error) {
      console.error('Erro ao carregar logo da empresa:', error);
    }
    
    // Informações da empresa no cabeçalho (lado direito)
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('FORTAL SOLUÇÕES', 130, 25);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('CNPJ: 29.564.347/0001-49', 130, 33);
    doc.text('RUA ERNESTO PEDRO DOS SANTOS, 66 - JOQUEI', 130, 40);
    doc.text('MARACANAÚ - CE', 130, 47);
    
    // Título "ORÇAMENTO" centralizado
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text('ORÇAMENTO', 105, 80, { align: 'center' });
    
    // Encontrar dados do cliente
    const cliente = clientes.find(c => c.name === budget.client_name);
    
    // Seção de informações do cliente
    let yPos = 100;
    
    // Cliente
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2]);
    doc.text('CLIENTE:', 20, yPos);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(budget.client_name?.toUpperCase() || '', 45, yPos);
    
    // Telefone
    yPos += 8;
    doc.setFont(undefined, 'bold');
    doc.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2]);
    doc.text('TELEFONE:', 20, yPos);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(cliente?.phone || '', 50, yPos);
    
    // Endereço
    yPos += 8;
    doc.setFont(undefined, 'bold');
    doc.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2]);
    doc.text('ENDEREÇO:', 20, yPos);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(cliente?.address || '', 50, yPos);
    
    // Bairro/Cidade
    yPos += 8;
    doc.setFont(undefined, 'bold');
    doc.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2]);
    doc.text('BAIRRO:', 20, yPos);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(cliente?.cidade || '', 43, yPos);
    
    // Espaço antes da tabela
    yPos += 20;
    
    // Cabeçalho da tabela
    doc.setFillColor(darkBlue[0], darkBlue[1], darkBlue[2]);
    doc.rect(20, yPos, 170, 10, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('QUANT', 25, yPos + 7);
    doc.text('ITEM / DESCRIÇÃO', 50, yPos + 7);
    doc.text('UNIT', 140, yPos + 7);
    doc.text('TOTAL', 170, yPos + 7);
    
    // Itens da tabela
    yPos += 10;
    let totalGeral = 0;
    
    if (budget.orcamento_items && budget.orcamento_items.length > 0) {
      budget.orcamento_items.forEach((item: any, index: number) => {
        const subtotal = item.quantity * parseFloat(item.price);
        totalGeral += subtotal;
        
        // Alternar cores das linhas
        if (index % 2 === 0) {
          doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
          doc.rect(20, yPos, 170, 10, 'F');
        }
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        
        // Quantidade (centralizada)
        doc.text(String(item.quantity).padStart(2, '0'), 28, yPos + 7);
        
        // Nome do produto
        doc.text(item.product_name, 25, yPos + 7);
        
        // Preço unitário (alinhado à direita)
        doc.text(`R$ ${formatCurrency(parseFloat(item.price))}`, 155, yPos + 7, { align: 'right' });
        
        // Total do item (alinhado à direita)
        doc.text(`R$ ${formatCurrency(subtotal)}`, 185, yPos + 7, { align: 'right' });
        
        yPos += 10;
      });
    }
    
    // Linha de separação
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPos, 190, yPos);
    
    // Total final
    yPos += 15;
    doc.setFillColor(darkBlue[0], darkBlue[1], darkBlue[2]);
    doc.rect(130, yPos - 5, 60, 12, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(`TOTAL: R$ ${formatCurrency(totalGeral)}`, 160, yPos + 3, { align: 'center' });
    
    // Seção de condições
    yPos += 30;
    
    // Título das condições
    doc.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2]);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('CONDIÇÕES:', 20, yPos);
    
    // Informações de pagamento
    yPos += 12;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('• Formas de Pagamento: 50% Para início da produção / 50% Ao Concluir-Receber', 25, yPos);
    
    yPos += 8;
    doc.text('• Prazos: A Combinar', 25, yPos);
    
    yPos += 8;
    doc.text('• Logística: Instalado', 25, yPos);
    
    yPos += 8;
    doc.text(`• Endereço de Instalação: ${cliente?.address || 'A definir'}`, 25, yPos);
    
    yPos += 12;
    doc.setFont(undefined, 'bold');
    doc.text('• Orçamento válido por 15 dias', 25, yPos);
    doc.text('• Pagamento de 50% no ato do fechamento e 50% na entrega', 25, yPos + 8);
    
    // Rodapé com informações da diretora
    const footerY = 250;
    
    // Linha separadora
    doc.setDrawColor(darkBlue[0], darkBlue[1], darkBlue[2]);
    doc.line(20, footerY, 190, footerY);
    
    // Informações da diretora
    doc.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2]);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('JENIFFER LEITE - (85) 98676.1518', 105, footerY + 12, { align: 'center' });
    doc.text('DIRETORA COMERCIAL', 105, footerY + 20, { align: 'center' });
    
    // Logo no rodapé (centralizada)
    try {
      const logoImg = new Image();
      logoImg.crossOrigin = "anonymous";
      
      await new Promise((resolve, reject) => {
        logoImg.onload = () => {
          doc.addImage(logoImg, 'PNG', 95, footerY + 25, 20, 15);
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
