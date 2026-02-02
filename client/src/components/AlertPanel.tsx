import { Bell } from "lucide-react";
import { Badge } from "./ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import type { PrefixGroup } from "@/pages/Home";

interface AlertPanelProps {
  groups: PrefixGroup[];
}

export function AlertPanel({ groups }: AlertPanelProps) {
  // Contar alertas (OPs atrasadas)
  const alertCount = groups.reduce((sum, group) => sum + group.late_count, 0);

  // Coletar OPs atrasadas
  const alerts = groups.flatMap(group =>
    group.pieces.flatMap(piece =>
      piece.orders
        .filter(order => order.status === 'atrasado')
        .map(order => ({
          group: group.prefix_name,
          piece: piece.product_code,
          opId: order.op_id,
          daysLate: order.days_late || 0,
          deadline: order.deadline
        }))
    )
  ).sort((a, b) => b.daysLate - a.daysLate).slice(0, 5); // Top 5 mais atrasadas

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-slate-800"
        >
          <Bell className="w-5 h-5" />
          {alertCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs"
            >
              {alertCount > 9 ? '9+' : alertCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Alertas de Produção</h4>
          {alerts.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum alerta no momento</p>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div
                  key={`${alert.group}-${alert.piece}-${alert.opId}`}
                  className="p-2 bg-red-50 border border-red-200 rounded text-xs"
                >
                  <div className="font-semibold text-red-900">
                    OP {alert.opId}
                  </div>
                  <div className="text-red-700">
                    {alert.group} → {alert.piece}
                  </div>
                  <div className="text-red-600 mt-1">
                    {alert.daysLate} {alert.daysLate === 1 ? 'dia' : 'dias'} de atraso
                  </div>
                </div>
              ))}
              {alertCount > 5 && (
                <p className="text-xs text-slate-500 text-center">
                  +{alertCount - 5} mais alertas
                </p>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
