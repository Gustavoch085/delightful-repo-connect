
import { Card, CardContent } from "@/components/ui/card";
import { Users, DollarSign, TrendingUp, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { useDataContext } from "@/contexts/DataContext";
import { LoadingScreen } from "./LoadingScreen";
import { 
  usePreloadedClients, 
  usePreloadedBudgets, 
  usePreloadedInvoices, 
  usePreloadedExpenses 
} from "@/hooks/usePreloadedData";

export function Dashboard() {
  const [dashboardData, setDashboardData] = useState({
    totalClientes: 0,
    receitasDoMes: "R$ 0,00",
    despesasDoMes: "R$ 0,00",
    orcamentosPendentes: 0,
    clientesRecentes: [],
    atividadesRecentes: []
  });

  const { isPreloading } = useDataContext();
  const { data: clientes = [] } = usePreloadedClients();
  const { data: orcamentos = [] } = usePreloadedBudgets();
  const { data: faturas = [] } = usePreloadedInvoices();
  const { data: despesas = [] } = usePreloadedExpenses();

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const isCurrentMonth = (dateString: string) => {
    const date = new Date(dateString);
    return date.getMonth() + 1 === currentMonth && date.getFullYear() === currentYear;
  };

  const calculateDashboardData = () => {
    const totalClientes = clientes.length;

    const receitasFaturas = faturas
      .filter(fatura => isCurrentMonth(fatura.date))
      .reduce((total, fatura) => {
        return total + parseFloat(fatura.value?.toString() || '0');
      }, 0);

    const receitasOrcamentos = orcamentos
      .filter(orcamento => 
        orcamento.status === 'Finalizado' && 
        (isCurrentMonth(orcamento.date) || (orcamento.delivery_date && isCurrentMonth(orcamento.delivery_date)))
      )
      .reduce((total, orcamento) => {
        return total + parseFloat(orcamento.total?.toString() || '0');
      }, 0);

    const receitasTotal = receitasFaturas + receitasOrcamentos;

    const despesasTotal = despesas
      .filter(despesa => isCurrentMonth(despesa.date))
      .reduce((total, expense) => {
        return total + parseFloat(expense.value?.toString() || '0');
      }, 0);

    const orcamentosPendentes = orcamentos.filter(budget => budget.status === 'Aguardando').length;
    const clientesRecentes = clientes.slice(0, 2);

    const atividadesRecentes = orcamentos.slice(0, 2).map(budget => ({
      title: budget.title || 'Orçamento',
      client: budget.client_name,
      value: formatCurrency(parseFloat(budget.total?.toString() || '0')),
      date: new Date(budget.date).toLocaleDateString('pt-BR')
    }));

    setDashboardData({
      totalClientes,
      receitasDoMes: formatCurrency(receitasTotal),
      despesasDoMes: formatCurrency(despesasTotal),
      orcamentosPendentes,
      clientesRecentes,
      atividadesRecentes
    });
  };

  useEffect(() => {
    calculateDashboardData();
  }, [clientes, orcamentos, despesas, faturas]);

  if (isPreloading) {
    return <LoadingScreen />;
  }

  const stats = [
    {
      title: "Total Clientes",
      value: dashboardData.totalClientes.toString(),
      icon: Users,
      iconBg: "bg-blue-600",
    },
    {
      title: "Receitas do Mês",
      value: dashboardData.receitasDoMes,
      icon: DollarSign,
      iconBg: "bg-green-600",
    },
    {
      title: "Despesas do Mês",
      value: dashboardData.despesasDoMes,
      icon: TrendingUp,
      iconBg: "bg-red-600",
    },
    {
      title: "Orçamentos Pendentes",
      value: dashboardData.orcamentosPendentes.toString(),
      icon: Calendar,
      iconBg: "bg-yellow-600",
    },
  ];

  return (
    <div className="p-6 bg-crm-dark min-h-screen">
      <h1 className="text-3xl font-bold text-white mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title} className="bg-crm-card border-crm-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">{stat.title}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 ${stat.iconBg} rounded-lg flex items-center justify-center`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-crm-card border-crm-border">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Clientes Recentes</h3>
            <div className="space-y-4">
              {dashboardData.clientesRecentes.length > 0 ? (
                dashboardData.clientesRecentes.map((client, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{client.name}</p>
                      <p className="text-gray-400 text-sm">{client.phone}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400">Nenhum cliente cadastrado ainda</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-crm-card border-crm-border">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Atividade Recente</h3>
            <div className="space-y-4">
              {dashboardData.atividadesRecentes.length > 0 ? (
                dashboardData.atividadesRecentes.map((activity, index) => (
                  <div key={index} className="flex justify-between items-start">
                    <div>
                      <p className="text-white font-medium">{activity.title}</p>
                      <p className="text-gray-400 text-sm">{activity.client}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-semibold">{activity.value}</p>
                      <p className="text-gray-400 text-sm">{activity.date}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400">Nenhuma atividade registrada ainda</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
