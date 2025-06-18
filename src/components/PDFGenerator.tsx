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
    
    // Configurar fonte
    doc.setFontSize(20);
    doc.text('ORÇAMENTO - FORTAL CRM', 20, 30);
    
    // Linha separadora
    doc.setLineWidth(0.5);
    doc.line(20, 35, 190, 35);
    
    // Dados do cliente
    doc.setFontSize(14);
    doc.text('DADOS DO CLIENTE', 20, 50);
    
    doc.setFontSize(11);
    let yPosition = 60;
    doc.text(`Nome: ${budget.client_name}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Endereço: ${cliente?.address || 'Não informado'}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Telefone: ${cliente?.phone || 'Não informado'}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Cidade: ${cliente?.cidade || 'Não informado'}`, 20, yPosition);
    
    // Linha separadora
    yPosition += 15;
    doc.line(20, yPosition, 190, yPosition);
    
    // Produtos do orçamento
    yPosition += 10;
    doc.setFontSize(14);
    doc.text('PRODUTOS DO ORÇAMENTO', 20, yPosition);
    
    doc.setFontSize(11);
    yPosition += 15;
    
    if (budget.orcamento_items && budget.orcamento_items.length > 0) {
      budget.orcamento_items.forEach((item: any, index: number) => {
        const subtotal = item.quantity * parseFloat(item.price);
        doc.text(`${index + 1}. ${item.product_name}`, 20, yPosition);
        yPosition += 8;
        doc.text(`   Quantidade: ${item.quantity}`, 20, yPosition);
        yPosition += 8;
        doc.text(`   Preço unitário: R$ ${parseFloat(item.price).toFixed(2).replace('.', ',')}`, 20, yPosition);
        yPosition += 8;
        doc.text(`   Subtotal: R$ ${subtotal.toFixed(2).replace('.', ',')}`, 20, yPosition);
        yPosition += 12;
        
        // Verificar se precisa de nova página
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 30;
        }
      });
    } else {
      doc.text('Nenhum produto adicionado', 20, yPosition);
      yPosition += 15;
    }
    
    // Linha separadora
    doc.line(20, yPosition, 190, yPosition);
    
    // Total
    yPosition += 10;
    doc.setFontSize(14);
    doc.text('RESUMO FINANCEIRO', 20, yPosition);
    
    yPosition += 15;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`Total Geral: R$ ${totalProdutos.toFixed(2).replace('.', ',')}`, 20, yPosition);
    
    // Informações adicionais
    yPosition += 20;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(`Data de criação: ${new Date(budget.created_at).toLocaleDateString('pt-BR')}`, 20, yPosition);
    
    if (budget.delivery_date) {
      yPosition += 8;
      doc.text(`Data de entrega: ${new Date(budget.delivery_date).toLocaleDateString('pt-BR')}`, 20, yPosition);
    }
    
    yPosition += 8;
    doc.text(`Status: ${budget.status}`, 20, yPosition);
    
    // Rodapé
    yPosition += 15;
    doc.setFontSize(8);
    doc.text('Gerado pelo Sistema Fortal CRM', 20, yPosition);
    
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
