
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import jsPDF from 'jspdf';

interface PDFGeneratorProps {
  budget: any;
  clientes: any[];
  disabled?: boolean;
}

export function PDFGenerator({ budget, clientes, disabled = false }: PDFGeneratorProps) {
  const generatePDF = () => {
    // Encontrar dados completos do cliente
    const cliente = clientes.find(c => c.name === budget.client_name);
    
    // Calcular total dos produtos
    const totalProdutos = budget.orcamento_items?.reduce((total: number, item: any) => {
      return total + (item.quantity * parseFloat(item.price));
    }, 0) || 0;

    // Criar novo documento PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // Cores
    const primaryColor = [0, 191, 255]; // Azul ciano
    const darkColor = [0, 0, 0];
    const grayColor = [128, 128, 128];
    
    // Header com faixa colorida
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 25, 'F');
    
    // Título principal
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('ORÇAMENTO DETALHADO', 20, 17);
    
    // Reset cor do texto
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    
    // Informações do cliente - layout em duas colunas
    let yPosition = 45;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('CLIENTE:', 20, yPosition);
    doc.text('ENDEREÇO:', pageWidth/2 + 20, yPosition);
    
    yPosition += 8;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(11);
    doc.text(budget.client_name || 'Não informado', 20, yPosition);
    doc.text(cliente?.address || 'Não informado', pageWidth/2 + 20, yPosition);
    
    yPosition += 8;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.text('TELEFONE:', 20, yPosition);
    doc.text('BAIRRO/CIDADE:', pageWidth/2 + 20, yPosition);
    
    yPosition += 8;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(11);
    doc.text(cliente?.phone || 'Não informado', 20, yPosition);
    doc.text(`${cliente?.cidade || 'Não informado'}`, pageWidth/2 + 20, yPosition);
    
    // Linha separadora
    yPosition += 15;
    doc.setLineWidth(1);
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    
    // Serviços/Produtos
    yPosition += 15;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('SERVIÇO: PRODUTOS E SERVIÇOS', pageWidth/2, yPosition, { align: 'center' });
    
    yPosition += 15;
    
    if (budget.orcamento_items && budget.orcamento_items.length > 0) {
      budget.orcamento_items.forEach((item: any, index: number) => {
        const subtotal = item.quantity * parseFloat(item.price);
        
        // Box para cada item
        const boxHeight = 40;
        doc.setFillColor(245, 245, 245);
        doc.rect(20, yPosition - 5, pageWidth - 40, boxHeight, 'F');
        doc.setDrawColor(200, 200, 200);
        doc.rect(20, yPosition - 5, pageWidth - 40, boxHeight, 'S');
        
        // Quantidade no círculo
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.circle(35, yPosition + 15, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(`${item.quantity}X`, 35, yPosition + 18, { align: 'center' });
        
        // Nome do produto
        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(item.product_name.toUpperCase(), 55, yPosition + 8);
        
        // Preço unitário
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
        doc.text(`Preço unitário: R$ ${parseFloat(item.price).toFixed(2).replace('.', ',')}`, 55, yPosition + 20);
        
        // Valor total do item
        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(`R$ ${subtotal.toFixed(2).replace('.', ',')}`, pageWidth - 30, yPosition + 15, { align: 'right' });
        
        yPosition += boxHeight + 10;
        
        // Verificar se precisa de nova página
        if (yPosition > pageHeight - 80) {
          doc.addPage();
          yPosition = 30;
        }
      });
    } else {
      doc.setFontSize(11);
      doc.text('Nenhum produto adicionado', 20, yPosition);
      yPosition += 15;
    }
    
    // Box do total
    yPosition += 10;
    doc.setFillColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.rect(pageWidth - 120, yPosition - 5, 100, 25, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('TOTALIZANDO:', pageWidth - 70, yPosition + 5, { align: 'center' });
    doc.setFontSize(16);
    doc.text(`R$ ${totalProdutos.toFixed(2).replace('.', ',')}`, pageWidth - 70, yPosition + 15, { align: 'center' });
    
    // Informações adicionais
    yPosition += 40;
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text('ORÇAMENTO VÁLIDO POR: 30 DIAS', 20, yPosition);
    yPosition += 8;
    doc.text('PRAZO DE ENTREGA: CONFORME SERVIÇO E/OU PROGRAMAÇÃO', 20, yPosition);
    yPosition += 8;
    doc.text(`DATA DO ORÇAMENTO: ${new Date(budget.created_at).toLocaleDateString('pt-BR')}`, 20, yPosition);
    
    if (budget.delivery_date) {
      yPosition += 8;
      doc.text(`DATA DE ENTREGA: ${new Date(budget.delivery_date).toLocaleDateString('pt-BR')}`, 20, yPosition);
    }
    
    yPosition += 8;
    doc.text(`STATUS: ${budget.status}`, 20, yPosition);
    
    // Logo da empresa (usando a logo enviada)
    yPosition = pageHeight - 60;
    
    // Adicionar a logo como imagem
    const logoImg = new Image();
    logoImg.onload = function() {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = logoImg.width;
      canvas.height = logoImg.height;
      ctx?.drawImage(logoImg, 0, 0);
      
      const logoDataUrl = canvas.toDataURL('image/png');
      
      // Calcular dimensões para centralizar a logo
      const logoWidth = 60;
      const logoHeight = 30;
      const logoX = (pageWidth - logoWidth) / 2;
      
      doc.addImage(logoDataUrl, 'PNG', logoX, yPosition, logoWidth, logoHeight);
      
      // CNPJ da empresa
      yPosition += logoHeight + 10;
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('29.564.347.0001-49', pageWidth/2, yPosition, { align: 'center' });
      
      // Salvar o PDF
      const fileName = `orcamento_${budget.client_name.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;
      doc.save(fileName);
    };
    
    logoImg.onerror = function() {
      // Se não conseguir carregar a logo, apenas adicionar o CNPJ
      yPosition += 20;
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('29.564.347.0001-49', pageWidth/2, yPosition, { align: 'center' });
      
      // Salvar o PDF
      const fileName = `orcamento_${budget.client_name.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;
      doc.save(fileName);
    };
    
    // Tentar carregar a logo
    logoImg.src = '/lovable-uploads/3d1371a0-e99a-4331-95f6-265e853c6a4f.png';
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
