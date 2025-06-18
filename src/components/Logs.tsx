
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLogs } from "@/contexts/LogsContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Users, FileText, DollarSign } from "lucide-react";

const actionColors = {
  create: "bg-green-100 text-green-800",
  edit: "bg-blue-100 text-blue-800",
  delete: "bg-red-100 text-red-800"
};

const actionLabels = {
  create: "Criou",
  edit: "Editou",
  delete: "Excluiu"
};

const entityIcons = {
  cliente: Users,
  produto: FileText,
  orcamento: DollarSign
};

const entityLabels = {
  cliente: "Cliente",
  produto: "Produto",
  orcamento: "Orçamento"
};

export function Logs() {
  const { logs } = useLogs();

  return (
    <div className="p-6 bg-crm-dark min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Logs de Atividades</h1>
        <p className="text-gray-400 mt-2">Histórico de todas as ações realizadas no sistema</p>
      </div>

      <Card className="bg-crm-card border-crm-border">
        <CardHeader>
          <CardTitle className="text-white">Atividades Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">Nenhuma atividade registrada ainda.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => {
                const Icon = entityIcons[log.entity];
                return (
                  <div key={log.id} className="flex items-start gap-4 p-4 rounded-lg bg-crm-dark border border-crm-border">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={actionColors[log.action]}>
                          {actionLabels[log.action]}
                        </Badge>
                        <span className="text-gray-400 text-sm">
                          {entityLabels[log.entity]}
                        </span>
                      </div>
                      <p className="text-white">
                        <strong>{log.userName}</strong> {actionLabels[log.action].toLowerCase()} o {entityLabels[log.entity].toLowerCase()} <strong>{log.entityName}</strong>
                      </p>
                      {log.details && (
                        <p className="text-gray-400 text-sm mt-1">{log.details}</p>
                      )}
                      <p className="text-gray-500 text-xs mt-2">
                        {format(new Date(log.timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
