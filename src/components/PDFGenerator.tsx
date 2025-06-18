
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
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text('Orçamento', 20, 30);
    
    // Client info
    doc.setFontSize(12);
    doc.text(`Cliente: ${budget.client_name}`, 20, 50);
    doc.text(`Data: ${new Date(budget.created_at).toLocaleDateString('pt-BR')}`, 20, 60);
    
    if (budget.delivery_date) {
      doc.text(`Data de Entrega: ${new Date(budget.delivery_date).toLocaleDateString('pt-BR')}`, 20, 70);
    }
    
    doc.text(`Status: ${budget.status}`, 20, 80);
    
    // Items
    let yPosition = 100;
    doc.text('Itens:', 20, yPosition);
    yPosition += 10;
    
    let total = 0;
    
    if (budget.orcamento_items && budget.orcamento_items.length > 0) {
      budget.orcamento_items.forEach((item: any, index: number) => {
        const subtotal = item.quantity * parseFloat(item.price);
        total += subtotal;
        
        doc.text(`${item.quantity}x ${item.product_name} - R$ ${subtotal.toFixed(2)}`, 20, yPosition);
        yPosition += 10;
      });
    }
    
    // Total
    yPosition += 10;
    doc.setFontSize(14);
    doc.text(`Total: R$ ${total.toFixed(2)}`, 20, yPosition);
    
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
