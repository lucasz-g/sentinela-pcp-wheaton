import { useState, useRef, useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Package,
  Layers,
} from "lucide-react";
import type { PrefixGroup } from "@/pages/Home";
import { OperationStepper } from "@/components/OperationStepper.tsx";

interface PrefixGroupListProps {
  groups: PrefixGroup[];
}

export default function PrefixGroupList({ groups }: PrefixGroupListProps) {
  const [expandedPrefixes, setExpandedPrefixes] = useState<string[]>([]);
  const [expandedPieces, setExpandedPieces] = useState<string[]>([]);
  const orderRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    // Auto-expandir primeiro prefixo se houver dados
    if (groups.length > 0 && expandedPrefixes.length === 0) {
      setExpandedPrefixes([`prefix-${groups[0].prefix}`]);
    }
  }, [groups]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "atrasado":
        return <AlertTriangle className="w-4 h-4" />;
      case "concluido":
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "atrasado":
        return "bg-red-500/10 text-red-700 border-red-200";
      case "concluido":
        return "bg-green-500/10 text-green-700 border-green-200";
      default:
        return "bg-blue-500/10 text-blue-700 border-blue-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "atrasado":
        return "Atrasado";
      case "concluido":
        return "Concluído";
      default:
        return "No Prazo";
    }
  };

  if (groups.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow-sm">
        <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-700 mb-2">
          Nenhuma ordem encontrada
        </h3>
        <p className="text-slate-500">
          Tente ajustar os filtros ou a busca para encontrar ordens de produção.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map(group => (
        <div
          key={group.prefix}
          className="bg-white rounded-lg shadow-sm overflow-hidden"
        >
          <Accordion
            type="multiple"
            value={expandedPrefixes}
            onValueChange={setExpandedPrefixes}
          >
            <AccordionItem
              value={`prefix-${group.prefix}`}
              className="border-none"
            >
              <AccordionTrigger className="px-6 py-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Layers className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-bold text-slate-900">
                        {group.prefix_name}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm text-slate-600">Total de OPs</div>
                      {/* <div className="text-2xl font-bold text-slate-900">
                        {group.total_orders}
                      </div> */}
                    </div>
                    {/* {group.late_count > 0 && (
                      <Badge variant="destructive" className="text-sm">
                        {group.late_count} {group.late_count === 1 ? 'Atrasada' : 'Atrasadas'}
                      </Badge>
                    )}
                    {group.critical_count > 0 && (
                      <Badge variant="outline" className="text-sm border-amber-500 text-amber-700 bg-amber-50">
                        {group.critical_count} {group.critical_count === 1 ? 'Crítica' : 'Críticas'}
                      </Badge>
                    )} */}
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-6 pb-4">
                <div className="space-y-3">
                  {group.pieces.map(piece => (
                    <div
                      key={piece.product_code}
                      className={`border rounded-lg overflow-hidden ${
                        piece.is_critical
                          ? "border-red-600 border-2 shadow-lg shadow-red-500/20"
                          : "border-slate-200"
                      }`}
                    >
                      <Accordion
                        type="multiple"
                        value={expandedPieces}
                        onValueChange={setExpandedPieces}
                      >
                        <AccordionItem
                          value={`piece-${piece.product_code}`}
                          className="border-none"
                        >
                          <AccordionTrigger className="px-4 py-3 hover:bg-slate-50">
                            <div className="flex items-center justify-between w-full pr-4">
                              <div className="flex items-center gap-3">
                                <Package className="w-5 h-5 text-slate-600" />

                                <div className="text-left">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-slate-900">
                                      {piece.product_code}
                                    </span>

                                    {piece.is_critical && (
                                      <Badge
                                        variant="outline"
                                        className="border-red-600 text-red-700 bg-red-50 text-xs"
                                      >
                                        Caminho Crítico
                                      </Badge>
                                    )}
                                  </div>

                                  <div className="text-sm text-slate-600">
                                    {piece.product_desc}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-600">
                                  {piece.orders.length}{" "}
                                  {piece.orders.length === 1 ? "OP" : "OPs"}
                                </span>
                              </div>
                            </div>
                          </AccordionTrigger>

                          <AccordionContent className="px-4 pb-3">
                            <div className="space-y-2">
                              {piece.orders
                                .slice()
                                .sort(
                                  (a, b) =>
                                    Number(b.is_critical) -
                                    Number(a.is_critical)
                                )
                                .map(order => (
                                  <div
                                    key={order.op_id}
                                    ref={el => {
                                      orderRefs.current[order.op_id] = el;
                                    }}
                                    className={`border rounded-lg p-4 transition-all ${
                                      order.is_critical
                                        ? "border-red-600 border-2 shadow-lg shadow-red-500/20"
                                        : "border-slate-200 bg-slate-50/50"
                                    }`}
                                  >
                                    {/* Cabeçalho da OP */}
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                          <h4 className="font-semibold text-slate-900">
                                            OP {order.op_id}
                                          </h4>
                                          <Badge
                                            variant="outline"
                                            className={getStatusColor(
                                              order.status
                                            )}
                                          >
                                            <span className="flex items-center gap-1">
                                              {getStatusIcon(order.status)}
                                              {getStatusLabel(order.status)}
                                            </span>
                                          </Badge>
                                          {order.has_missing_pieces && (
                                            <Badge className="bg-amber-500/10 text-amber-700 border border-amber-300">
                                              <AlertTriangle className="w-3 h-3 mr-1" />
                                              Falta de peças
                                            </Badge>
                                          )}
                                          {order.is_critical && (
                                            <Badge className="bg-red-600 text-white">
                                              Caminho Crítico
                                            </Badge>
                                          )}
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                          <div>
                                            <span className="text-slate-600">
                                              Emissão:
                                            </span>
                                            <div className="font-medium text-slate-900">
                                              {new Date(
                                                order.emission_date
                                              ).toLocaleDateString("pt-BR")}
                                            </div>
                                          </div>

                                          <div>
                                            <span className="text-slate-600">
                                              Prazo:
                                            </span>
                                            <div className="font-medium text-slate-900">
                                              {new Date(
                                                order.deadline
                                              ).toLocaleDateString("pt-BR")}
                                            </div>
                                          </div>

                                          <div>
                                            <span className="text-slate-600">
                                              Qtd. Planejada:
                                            </span>
                                            <div className="font-medium text-slate-900">
                                              {order.planned_quantity}
                                            </div>
                                          </div>

                                          <div>
                                            <span className="text-slate-600">
                                              Qtd. Real:
                                            </span>
                                            <div className="font-medium text-slate-900">
                                              {order.real_quantity}
                                            </div>
                                          </div>
                                          <div>
                                            <span className="text-slate-600">
                                              Tempo Restante:
                                            </span>
                                            <div className="font-medium text-slate-900">
                                              {order.remaining_hours}h
                                            </div>
                                          </div>
                                          {order.status !== "concluido" &&
                                            order.days_late !== undefined &&
                                            order.days_late > 0 && (
                                              <div>
                                                <span className="text-slate-600">
                                                  Atraso:
                                                </span>
                                                <div className="font-medium text-red-600">
                                                  {order.days_late}{" "}
                                                  {order.days_late === 1
                                                    ? "dia"
                                                    : "dias"}
                                                </div>
                                              </div>
                                            )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Progresso */}
                                    <div className="mb-3">
                                      <div className="flex items-center justify-between text-sm mb-2">
                                        <span className="text-slate-600">
                                          Progresso
                                        </span>
                                        <span className="font-semibold text-slate-900">
                                          {order.progress}%
                                        </span>
                                      </div>
                                      <Progress
                                        value={order.progress}
                                        className="h-3"
                                      />
                                    </div>

                                    {/* Fluxo */}
                                    <div>
                                      <div className="text-sm font-medium text-slate-700 mb-2">
                                        Fluxo de Operações
                                      </div>
                                      <OperationStepper
                                        operations={order.operations}
                                      />
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      ))}
    </div>
  );
}
