
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, DollarSign, FileText } from "lucide-react";
import jsPDF from 'jspdf';

interface RelatorioMensalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  relatorio: any;
}

export function RelatorioMensalModal({ open, onOpenChange, relatorio }: RelatorioMensalModalProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getMonthName = (month: number) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month - 1];
  };

  const generatePDF = async () => {
    if (!relatorio) return;
    
    setIsGeneratingPDF(true);
    
    const doc = new jsPDF();
    
    // Add logo at the top
    try {
      const logoImg = new Image();
      logoImg.crossOrigin = "anonymous";
      
      await new Promise((resolve, reject) => {
        logoImg.onload = () => {
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
    
    // Company CNPJ
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
    doc.text(`Relatório Mensal - ${getMonthName(relatorio.mes)}/${relatorio.ano}`, 20, 65);
    
    let yPosition = 85;
    
    // Financial Summary
    doc.setFontSize(14);
    doc.text('Resumo Financeiro:', 20, yPosition);
    yPosition += 15;
    
    doc.setFontSize(12);
    doc.text(`Total de Receitas: ${formatCurrency(parseFloat(relatorio.total_receitas))}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Total de Despesas: ${formatCurrency(parseFloat(relatorio.total_despesas))}`, 20, yPosition);
    yPosition += 10;
    
    // Lucro com cor
    const lucro = parseFloat(relatorio.lucro_liquido);
    if (lucro >= 0) {
      doc.setTextColor(0, 128, 0); // Verde
    } else {
      doc.setTextColor(255, 0, 0); // Vermelho
    }
    doc.text(`Lucro Líquido: ${formatCurrency(lucro)}`, 20, yPosition);
    doc.setTextColor(0, 0, 0); // Volta para preto
    yPosition += 20;
    
    // Linha horizontal
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(20, yPosition, 190, yPosition);
    yPosition += 15;
    
    // Faturas
    doc.setFontSize(14);
    doc.text('Faturas:', 20, yPosition);
    yPosition += 10;
    
    const faturas = relatorio.faturas || [];
    if (faturas.length > 0) {
      doc.setFontSize(10);
      faturas.forEach((fatura: any) => {
        const faturaText = `${fatura.title} - ${fatura.client_name} - ${formatCurrency(parseFloat(fatura.value))} - ${new Date(fatura.date).toLocaleDateString('pt-BR')}`;
        doc.text(faturaText, 20, yPosition);
        yPosition += 8;
        
        // Check if we need a new page
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
      });
    } else {
      doc.setFontSize(10);
      doc.text('Nenhuma fatura registrada neste mês.', 20, yPosition);
      yPosition += 10;
    }
    
    yPosition += 10;
    
    // Linha horizontal
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(20, yPosition, 190, yPosition);
    yPosition += 15;
    
    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    
    // Despesas
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Despesas:', 20, yPosition);
    yPosition += 10;
    
    const despesas = relatorio.despesas || [];
    if (despesas.length > 0) {
      doc.setFontSize(10);
      despesas.forEach((despesa: any) => {
        const despesaText = `${despesa.title} - ${despesa.category || 'Sem Cliente'} - ${formatCurrency(parseFloat(despesa.value))} - ${new Date(despesa.date).toLocaleDateString('pt-BR')}`;
        doc.text(despesaText, 20, yPosition);
        yPosition += 8;
        
        // Check if we need a new page
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
      });
    } else {
      doc.setFontSize(10);
      doc.text('Nenhuma despesa registrada neste mês.', 20, yPosition);
    }
    
    // Save
    const fileName = `relatorio_${getMonthName(relatorio.mes).toLowerCase()}_${relatorio.ano}.pdf`;
    doc.save(fileName);
    
    setIsGeneratingPDF(false);
  };

  if (!relatorio) return null;

  const financialStats = [
    {
      title: "Total Receitas",
      value: formatCurrency(parseFloat(relatorio.total_receitas)),
      icon: TrendingUp,
      iconBg: "bg-green-600",
      color: "text-green-400"
    },
    {
      title: "Total Despesas",
      value: formatCurrency(parseFloat(relatorio.total_despesas)), 
      icon: TrendingDown,
      iconBg: "bg-red-600",
      color: "text-red-400"
    },
    {
      title: "Lucro Líquido",
      value: formatCurrency(parseFloat(relatorio.lucro_liquido)),
      icon: DollarSign,
      iconBg: parseFloat(relatorio.lucro_liquido) >= 0 ? "bg-green-600" : "bg-red-600",
      color: parseFloat(relatorio.lucro_liquido) >= 0 ? "text-green-400" : "text-red-400"
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-crm-card border-crm-border text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl">
              Relatório de {getMonthName(relatorio.mes)} {relatorio.ano}
            </DialogTitle>
            <Button
              onClick={generatePDF}
              disabled={isGeneratingPDF}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <FileText className="h-4 w-4 mr-2" />
              {isGeneratingPDF ? 'Gerando...' : 'Gerar PDF'}
            </Button>
          </div>
        </DialogHeader>
        
        {/* Financial Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {financialStats.map((stat) => (
            <Card key={stat.title} className="bg-crm-dark border-crm-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">{stat.title}</p>
                    <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                  <div className={`w-10 h-10 ${stat.iconBg} rounded-lg flex items-center justify-center`}>
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs for Expenses and Revenues */}
        <Card className="bg-crm-dark border-crm-border">
          <CardContent className="p-4">
            <Tabs defaultValue="revenues" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-crm-card">
                <TabsTrigger value="revenues" className="text-gray-300 data-[state=active]:text-white">
                  Faturas ({relatorio.faturas?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="expenses" className="text-gray-300 data-[state=active]:text-white">
                  Despesas ({relatorio.despesas?.length || 0})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="revenues" className="mt-4">
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {relatorio.faturas && relatorio.faturas.length > 0 ? (
                    relatorio.faturas.map((fatura: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-3 rounded-lg border border-crm-border bg-crm-card">
                        <div>
                          <p className="text-white font-medium">{fatura.title}</p>
                          <p className="text-gray-400 text-sm">
                            {fatura.client_name} • {new Date(fatura.date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <p className="text-green-400 font-semibold">+ {formatCurrency(parseFloat(fatura.value))}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-center py-4">Nenhuma fatura registrada neste mês.</p>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="expenses" className="mt-4">
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {relatorio.despesas && relatorio.despesas.length > 0 ? (
                    relatorio.despesas.map((despesa: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-3 rounded-lg border border-crm-border bg-crm-card">
                        <div>
                          <p className="text-white font-medium">{despesa.title}</p>
                          <p className="text-gray-400 text-sm">
                            {despesa.category || 'Sem Cliente'} • {new Date(despesa.date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <p className="text-red-400 font-semibold">- {formatCurrency(parseFloat(despesa.value))}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-center py-4">Nenhuma despesa registrada neste mês.</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
