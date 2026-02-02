import { Bell } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { Alert } from "@/lib/alerts";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";

interface AlertBellProps {
  alerts: Alert[];
  onAlertClick?: (opId: string) => void;
}

export function AlertBell({ alerts, onAlertClick }: AlertBellProps) {
  const criticalCount = alerts.filter((a) => a.level === "critical").length;
  const hasAlerts = alerts.length > 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative",
            criticalCount > 0 && "animate-pulse-subtle"
          )}
        >
          <Bell className={cn(
            "w-5 h-5",
            criticalCount > 0 && "text-red-600 dark:text-red-400"
          )} />
          {hasAlerts && (
            <Badge
              className={cn(
                "absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs",
                criticalCount > 0
                  ? "bg-red-600"
                  : "bg-yellow-600"
              )}
            >
              {alerts.length > 9 ? "9+" : alerts.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Notificações</h3>
          <p className="text-sm text-muted-foreground">
            {hasAlerts
              ? `${alerts.length} alerta${alerts.length > 1 ? "s" : ""} ativo${alerts.length > 1 ? "s" : ""}`
              : "Nenhum alerta"}
          </p>
        </div>
        <ScrollArea className="h-[400px]">
          {hasAlerts ? (
            <div className="p-2 space-y-2">
              {alerts.slice(0, 10).map((alert) => (
                <button
                  key={alert.id}
                  onClick={() => {
                    onAlertClick?.(alert.opId);
                  }}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border transition-colors hover:bg-accent",
                    alert.level === "critical" && "border-red-500 bg-red-50 dark:bg-red-950/20",
                    alert.level === "warning" && "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20",
                    alert.level === "info" && "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full mt-1.5",
                      alert.level === "critical" && "bg-red-600",
                      alert.level === "warning" && "bg-yellow-600",
                      alert.level === "info" && "bg-blue-600"
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm mb-1">{alert.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {alert.message}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
              {alerts.length > 10 && (
                <p className="text-center text-xs text-muted-foreground py-2">
                  +{alerts.length - 10} alertas adicionais
                </p>
              )}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">
                Nenhuma notificação no momento
              </p>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
