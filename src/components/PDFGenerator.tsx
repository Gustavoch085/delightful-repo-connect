
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
    
    // Add logo at the top
    try {
      const logoImg = new Image();
      logoImg.crossOrigin = "anonymous";
      
      await new Promise((resolve, reject) => {
        logoImg.onload = () => {
          // Center the logo - A4 width is 210mm, logo width will be 60mm
          const logoWidth = 60;
          const logoHeight = 20;
          const xPosition = (210 - logoWidth) / 2;
          
          doc.addImage(logoImg, 'PNG', xPosition, 10, logoWidth, logoHeight);
          resolve(true);
        };
        logoImg.onerror = reject;
        logoImg.src = '/lovable-uploads/1324f7f9-dab1-498b-beea-7455ba388e4c.png';
      });
    } catch (error) {
      console.error('Erro ao carregar logo:', error);
    }
    
    // Company CNPJ - centered below logo
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const cnpjText = 'CNPJ: 29.564.347.0001-49';
    const cnpjWidth = doc.getTextWidth(cnpjText);
    const cnpjX = (210 - cnpjWidth) / 2;
    doc.text(cnpjText, cnpjX, 40);
    
    // Horizontal line separator
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(20, 50, 190, 50);
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.text('Orçamento', 20, 65);
    
    // Client info
    doc.setFontSize(12);
    doc.text(`Cliente: ${budget.client_name}`, 20, 80);
    doc.text(`Data: ${new Date(budget.created_at).toLocaleDateString('pt-BR')}`, 20, 90);
    
    if (budget.delivery_date) {
      doc.text(`Data de Entrega: ${new Date(budget.delivery_date).toLocaleDateString('pt-BR')}`, 20, 100);
    }
    
    doc.text(`Status: ${budget.status}`, 20, 110);
    
    // Linha horizontal após dados do cliente
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(20, 120, 190, 120);
    
    // Items
    let yPosition = 130;
    doc.text('Itens:', 20, yPosition);
    yPosition += 10;
    
    let total = 0;
    
    if (budget.orcamento_items && budget.orcamento_items.length > 0) {
      budget.orcamento_items.forEach((item: any, index: number) => {
        const subtotal = item.quantity * parseFloat(item.price);
        total += subtotal;
        
        doc.text(`${item.quantity}x ${item.product_name} - R$ ${formatCurrency(subtotal)}`, 20, yPosition);
        yPosition += 10;
      });
    }
    
    // Linha horizontal após os itens
    yPosition += 5;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(20, yPosition, 190, yPosition);
    
    // Total
    yPosition += 15;
    doc.setFontSize(14);
    doc.text(`Total: R$ ${formatCurrency(total)}`, 20, yPosition);
    
    // Save
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
