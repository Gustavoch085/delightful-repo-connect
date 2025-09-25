
import { Card, CardContent } from "@/components/ui/card";
import { Users, DollarSign, TrendingUp, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { useDataContext } from "@/contexts/DataContext";
import { LoadingScreen } from "./LoadingScreen";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  usePreloadedClients, 
  usePreloadedBudgets, 
  usePreloadedInvoices, 
  usePreloadedExpenses 
} from "@/hooks/usePreloadedData";

export function Dashboard() {
  const [dashboardData, setDashboardData] = useState({
    totalClientes: 0,
    vendasDoMes: "R$ 0,00",
    comprasDoMes: "R$ 0,00",
    orcamentosPendentes: 0,
    clientesRecentes: [],
    atividadesRecentes: [],
    chartData: []
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

    const vendasFaturas = faturas
      .filter(fatura => isCurrentMonth(fatura.date))
      .reduce((total, fatura) => {
        return total + parseFloat(fatura.value?.toString() || '0');
      }, 0);

    const vendasOrcamentos = orcamentos
      .filter(orcamento => 
        (orcamento.status === 'Finalizado' || orcamento.status === 'Venda Gerada') && 
        (isCurrentMonth(orcamento.created_at) || (orcamento.delivery_date && isCurrentMonth(orcamento.delivery_date)))
      )
      .reduce((total, orcamento) => {
        return total + parseFloat(orcamento.total?.toString() || '0');
      }, 0);

    const vendasTotal = vendasFaturas + vendasOrcamentos;

    const comprasTotal = despesas
      .filter(despesa => isCurrentMonth(despesa.date))
      .reduce((total, expense) => {
        return total + parseFloat(expense.amount?.toString() || '0');
      }, 0);

    const orcamentosPendentes = orcamentos.filter(budget => budget.status === 'Aguardando').length;
    const clientesRecentes = clientes.slice(0, 2);

    const atividadesRecentes = orcamentos.slice(0, 2).map(budget => ({
      title: budget.title || 'Orçamento',
      client: budget.client_name,
      value: formatCurrency(parseFloat(budget.total?.toString() || '0')),
      date: new Date(budget.created_at).toLocaleDateString('pt-BR')
    }));

    const chartData = [
      {
        name: 'Vendas',
        valor: vendasTotal,
        fill: '#10b981'
      },
      {
        name: 'Compras',
        valor: comprasTotal,
        fill: '#ef4444'
      }
    ];

    setDashboardData({
      totalClientes,
      vendasDoMes: formatCurrency(vendasTotal),
      comprasDoMes: formatCurrency(comprasTotal),
      orcamentosPendentes,
      clientesRecentes,
      atividadesRecentes,
      chartData
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
      title: "Vendas do Mês",
      value: dashboardData.vendasDoMes,
      icon: DollarSign,
      iconBg: "bg-green-600",
    },
    {
      title: "Compras do Mês",
      value: dashboardData.comprasDoMes,
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

      {/* Gráfico de Vendas e Compras */}
      <Card className="bg-crm-card border-crm-border mb-6">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Vendas vs Compras do Mês</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardData.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="name" 
                  stroke="#9ca3af"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#9ca3af"
                  fontSize={12}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: '#f3f4f6' }}
                  formatter={(value) => [formatCurrency(Number(value)), '']}
                />
                <Bar dataKey="valor" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

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
