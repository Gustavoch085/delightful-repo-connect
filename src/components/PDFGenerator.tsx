
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

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

    // Criar conteúdo do PDF
    const pdfContent = `
      ORÇAMENTO - FORTAL CRM
      
      ======================================
      DADOS DO CLIENTE
      ======================================
      Nome: ${budget.client_name}
      Endereço: ${cliente?.address || 'Não informado'}
      Telefone: ${cliente?.phone || 'Não informado'}
      Cidade: ${cliente?.address ? cliente.address.split(',').pop()?.trim() : 'Não informado'}
      
      ======================================
      PRODUTOS DO ORÇAMENTO
      ======================================
      ${budget.orcamento_items?.map((item: any, index: number) => 
        `${index + 1}. ${item.product_name}
           Quantidade: ${item.quantity}
           Preço unitário: R$ ${parseFloat(item.price).toFixed(2).replace('.', ',')}
           Subtotal: R$ ${(item.quantity * parseFloat(item.price)).toFixed(2).replace('.', ',')}
        `
      ).join('\n') || 'Nenhum produto adicionado'}
      
      ======================================
      RESUMO FINANCEIRO
      ======================================
      Total Geral: R$ ${totalProdutos.toFixed(2).replace('.', ',')}
      
      ======================================
      Data de criação: ${new Date(budget.created_at).toLocaleDateString('pt-BR')}
      ${budget.delivery_date ? `Data de entrega: ${new Date(budget.delivery_date).toLocaleDateString('pt-BR')}` : ''}
      Status: ${budget.status}
      
      ---
      Gerado pelo Sistema Fortal CRM
    `;

    // Criar arquivo para download
    const blob = new Blob([pdfContent], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orcamento_${budget.client_name.replace(/\s+/g, '_')}_${new Date().getTime()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
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
