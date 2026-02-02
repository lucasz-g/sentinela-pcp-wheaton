  import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from "@/components/ui/accordion";
  import { Badge } from "@/components/ui/badge";
  import { Progress } from "@/components/ui/progress";
  import { Calendar, Clock, AlertTriangle } from "lucide-react";
import { OperationStepper } from "./OperationStepper";

  interface Operation {
    code: string;
    desc: string;
    status: string;
  }

  interface Piece {
    product_code: string;
    product_desc: string;
    is_critical: boolean;
    remaining_hours: number;
    operations: Operation[];
  }

  interface ProductionOrder {
    op_id: string;
    status: string;
    progress: number;
    deadline: string;
    emission_date: string;
    days_late?: number;
    pieces: Piece[];
  }

  interface ProductionOrderListProps {
    orders: ProductionOrder[];
    orderRefs?: React.MutableRefObject<Map<string, HTMLElement>>;
  }

  function getStatusBadge(status: string, daysLate?: number) {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      atrasado: { label: `Atrasado (${daysLate || 0}d)`, variant: "destructive" },
      no_prazo: { label: "No Prazo", variant: "default" },
      concluido: { label: "Concluído", variant: "secondary" },
      concluido_com_atraso: { label: "Concluído com Atraso", variant: "outline" },
    };

    const config = variants[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  }

  function PieceCard({ piece }: { piece: Piece }) {
    return (
      <div
        className={`
          p-4 rounded-lg border-2 transition-all
          ${
            piece.is_critical
              ? "border-red-500 bg-red-50 dark:bg-red-950/20 animate-pulse-border"
              : "border-border bg-card"
          }
        `}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-semibold text-foreground">{piece.product_code}</h4>
            <p className="text-sm text-muted-foreground">{piece.product_desc}</p>
          </div>
          {piece.is_critical && (
            <Badge variant="destructive" className="ml-2">
              Caminho Crítico
            </Badge>
          )}
        </div>

        {piece.remaining_hours > 0 && (
          <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Tempo restante: {piece.remaining_hours.toFixed(1)}h</span>
          </div>
        )}

        <div className="mt-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">Fluxo de Operações</p>
          <OperationStepper operations={piece.operations} />
        </div>
      </div>
    );
  }

  export function ProductionOrderList({ orders, orderRefs }: ProductionOrderListProps) {
    if (orders.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <p className="text-lg font-medium text-foreground mb-2">Nenhuma ordem encontrada</p>
            <p className="text-muted-foreground">Tente ajustar os filtros ou a busca para encontrar ordens de produção.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Ordens de Produção</h2>
          <p className="text-muted-foreground">Total: {orders.length} OPs</p>
        </div>

        <Accordion type="multiple" className="space-y-4">
          {orders.map((order) => (
            <AccordionItem
              key={order.op_id}
              value={order.op_id}
              className="border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow"
              ref={(el) => {
                if (el && orderRefs) {
                  orderRefs.current.set(order.op_id, el);
                }
              }}
            >
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">OP {order.op_id}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>Prazo: {new Date(order.deadline).toLocaleDateString('pt-BR')}</span>
                        </div>
                        {order.days_late && order.days_late > 0 && (
                          <div className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                            <AlertTriangle className="w-4 h-4" />
                            <span>{order.days_late} dias de atraso</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end gap-2 min-w-[200px]">
                      {getStatusBadge(order.status, order.days_late)}
                      <div className="w-full">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Progresso</span>
                          <span>{order.progress}%</span>
                        </div>
                        <Progress value={order.progress} className="h-2" />
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-6 pb-6">
                <div className="space-y-4 mt-4">
                  {order.pieces.map((piece, index) => (
                    <PieceCard key={`${piece.product_code}-${index}`} piece={piece} />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    );
  }
