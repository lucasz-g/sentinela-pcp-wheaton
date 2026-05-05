import { OperationStepper } from "@/components/OperationStepper";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { PrefixGroup } from "@/pages/Home";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Layers,
  LayoutGrid,
  LayoutList,
  Loader2,
  MessageSquare,
  Package,
  Timer,
} from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Operation {
  code: string;
  desc: string;
  status: string;
  planned_qty?: number;
  real_qty?: number;
  planned_hours?: number;
  real_hours?: number;
  remaining_hours?: number;
}

interface Order {
  op_id: string;
  name?: string;
  status: string;
  progress: number;
  deadline: string;
  emission_date: string;
  days_late: number;
  remaining_hours: number;
  planned_hours?: number;
  real_hours?: number;
  operations: Operation[];
  is_critical?: boolean;
  has_missing_pieces?: boolean;
  planned_quantity: number;
  real_quantity: number;
}

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_META: Record<
  string,
  { label: string; icon: React.ReactNode; cls: string }
> = {
  atrasado: {
    label: "Atrasado",
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    cls: "bg-red-500/10 text-red-700 border-red-200",
  },
  concluido: {
    label: "Concluído",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    cls: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  },
  no_prazo: {
    label: "No Prazo",
    icon: <Clock className="w-3.5 h-3.5" />,
    cls: "bg-blue-500/10 text-blue-700 border-blue-200",
  },
};

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? STATUS_META.no_prazo;
  return (
    <Badge
      variant="outline"
      className={`flex items-center gap-1 text-xs ${meta.cls}`}
    >
      {meta.icon}
      {meta.label}
    </Badge>
  );
}

// ─── TimeBar ─────────────────────────────────────────────────────────────────

interface TimeBarProps {
  planned: number;
  real: number;
  remaining: number;
  compact?: boolean;
}

function TimeBar({ planned, real, remaining, compact = false }: TimeBarProps) {
  if (planned <= 0 && real <= 0 && remaining <= 0) return null;

  const over = planned > 0 && real > planned;
  const realPct = planned > 0 ? Math.min((real / planned) * 100, 100) : 0;
  const remPct =
    planned > 0 && !over
      ? Math.min((remaining / planned) * 100, 100 - realPct)
      : 0;

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-slate-500 flex-wrap">
        <Timer className="w-3 h-3 text-slate-400 shrink-0" />
        {planned > 0 && (
          <span>
            <span className="font-medium text-slate-700">{planned}h</span>
            <span className="text-slate-400"> plan.</span>
          </span>
        )}
        {real > 0 && (
          <>
            <span className="text-slate-300">·</span>
            <span>
              <span
                className={`font-medium ${over ? "text-red-600" : "text-emerald-600"}`}
              >
                {real}h
              </span>
              <span className="text-slate-400"> real</span>
            </span>
          </>
        )}
        {remaining > 0 && (
          <>
            <span className="text-slate-300">·</span>
            <span>
              <span className="font-medium text-amber-600">{remaining}h</span>
              <span className="text-slate-400"> rest.</span>
            </span>
          </>
        )}
        {over && (
          <span className="text-red-600 font-semibold">
            (+{Math.round(real - planned)}h acima)
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-3 flex-wrap">
          {planned > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-300" />
              Planejado <strong className="text-slate-700">{planned}h</strong>
            </span>
          )}
          {real > 0 && (
            <span className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${over ? "bg-red-500" : "bg-emerald-500"}`}
              />
              Real{" "}
              <strong className={over ? "text-red-700" : "text-emerald-700"}>
                {real}h
              </strong>
            </span>
          )}
          {remaining > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Restante <strong className="text-amber-700">{remaining}h</strong>
            </span>
          )}
        </div>
        {over && (
          <span className="font-semibold text-red-600 text-xs">
            +{Math.round(real - planned)}h acima do previsto
          </span>
        )}
      </div>
      <div className="relative h-2.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`absolute left-0 top-0 h-full rounded-l-full transition-all duration-500 ${
            over ? "bg-red-500 rounded-full" : "bg-emerald-500"
          }`}
          style={{ width: `${realPct}%` }}
        />
        {remPct > 0 && (
          <div
            className="absolute top-0 h-full bg-amber-300 transition-all duration-500"
            style={{ left: `${realPct}%`, width: `${remPct}%` }}
          />
        )}
      </div>
    </div>
  );
}

// ─── OperationRow ─────────────────────────────────────────────────────────────

function OperationRow({ op, index }: { op: Operation; index: number }) {
  const STATUS_PILL: Record<string, string> = {
    CONCLUIDA: "bg-emerald-100 text-emerald-700 border-emerald-200",
    EM_ANDAMENTO: "bg-blue-100 text-blue-700 border-blue-200",
    NAO_INICIADA: "bg-slate-100 text-slate-500 border-slate-200",
    INTERROMPIDA: "bg-amber-100 text-amber-700 border-amber-200",
  };
  const STATUS_LABEL: Record<string, string> = {
    CONCLUIDA: "Concluída",
    EM_ANDAMENTO: "Em Andamento",
    NAO_INICIADA: "Não Iniciada",
    INTERROMPIDA: "Interrompida",
  };

  const planned = op.planned_hours ?? 0;
  const real = op.real_hours ?? 0;
  const remaining = op.remaining_hours ?? 0;
  const pQty = op.planned_qty ?? 0;
  const rQty = op.real_qty ?? 0;

  return (
    <div className="flex flex-col gap-1.5 px-3 py-2.5 rounded-lg border border-slate-100 bg-white hover:border-slate-200 transition-colors">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="shrink-0 w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold flex items-center justify-center">
          {index + 1}
        </span>
        <span className="font-medium text-slate-800 text-sm flex-1 min-w-0 truncate">
          {op.desc || op.code}
        </span>
        {pQty > 0 && (
          <span className="shrink-0 text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono border border-slate-200">
            {String(rQty).padStart(2, "0")}/{String(pQty).padStart(2, "0")}
          </span>
        )}
        <span
          className={`shrink-0 text-[11px] px-2 py-0.5 rounded-full border font-medium ${
            STATUS_PILL[op.status] ?? STATUS_PILL.NAO_INICIADA
          }`}
        >
          {STATUS_LABEL[op.status] ?? op.status}
        </span>
      </div>
      {planned > 0 && (
        <TimeBar planned={planned} real={real} remaining={remaining} compact />
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function MetaItem({
  label,
  value,
  valueClass = "text-slate-900 font-medium",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div>
      <div className="text-slate-500">{label}</div>
      <div className={valueClass}>{value}</div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
      {children}
    </div>
  );
}

function fmtDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("pt-BR");
  } catch {
    return dateStr;
  }
}

// ─── OrderCard ────────────────────────────────────────────────────────────────

function OrderCard({
  order,
  defaultOpen = false,
}: {
  order: Order;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  // sync when parent changes defaultOpen (e.g. switching to expanded mode)
  useEffect(() => {
    setOpen(defaultOpen);
  }, [defaultOpen]);

  return (
    <div
      className={`rounded-xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:bg-white ${
        order.is_critical
          ? "border-red-500 border-2 shadow-md shadow-red-500/10 hover:shadow-red-500/20"
          : "border-slate-200 bg-slate-50/30 hover:border-slate-300"
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full px-4 py-3.5 flex items-start gap-3 hover:bg-white/70 rounded-xl text-left transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2.5">
            <span className="font-bold text-slate-900 text-sm">
              OP {order.op_id}
            </span>
            <StatusBadge status={order.status} />
            {order.is_critical && (
              <Badge className="bg-red-600 text-white text-xs">
                Caminho Crítico
              </Badge>
            )}
            {order.has_missing_pieces && (
              <Badge className="bg-amber-500/10 text-amber-700 border border-amber-300 text-xs">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Falta de peças
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1.5 text-xs mb-2.5">
            <MetaItem label="Emissão" value={fmtDate(order.emission_date)} />
            <MetaItem label="Prazo" value={fmtDate(order.deadline)} />
            <MetaItem
              label="Qtd. Plan."
              value={String(order.planned_quantity)}
            />
            <MetaItem label="Qtd. Real" value={String(order.real_quantity)} />
            {order.status !== "concluido" && order.days_late > 0 && (
              <MetaItem
                label="Atraso"
                value={`${order.days_late} ${order.days_late === 1 ? "dia" : "dias"}`}
                valueClass="text-red-600 font-semibold"
              />
            )}
          </div>

          <div className="flex items-center gap-2 mb-2.5">
            <Progress value={order.progress} className="h-1.5 flex-1" />
            <span className="text-xs font-semibold text-slate-700 tabular-nums w-8 text-right">
              {order.progress}%
            </span>
          </div>

          <TimeBar
            planned={order.planned_hours ?? 0}
            real={order.real_hours ?? 0}
            remaining={order.remaining_hours}
            compact
          />
        </div>

        <div className="shrink-0 text-slate-400 mt-0.5">
          {open ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-4">
          <div>
            <SectionLabel>Fluxo de operações</SectionLabel>
            <OperationStepper operations={order.operations} />
          </div>
          <div>
            <SectionLabel>Detalhe por operação</SectionLabel>
            <div className="space-y-1.5">
              {order.operations.map((op, idx) => (
                <OperationRow key={`${op.code}-${idx}`} op={op} index={idx} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PieceCard ────────────────────────────────────────────────────────────────

function PieceCard({
  piece,
  expandedPieces,
  onToggle,
  allOrdersOpen,
}: {
  piece: any;
  expandedPieces: string[];
  onToggle: (key: string) => void;
  allOrdersOpen: boolean;
}) {
  const key = `piece-${piece.product_code}`;
  const isOpen = expandedPieces.includes(key);

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:bg-white ${
        piece.is_critical
          ? "border-red-500 border-2 shadow-md shadow-red-500/10 hover:shadow-red-500/20"
          : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <button
        type="button"
        onClick={() => onToggle(key)}
        className="w-full px-4 py-3 flex items-start gap-3 hover:bg-slate-50 text-left transition-colors"
      >
        <Package className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <span className="font-semibold text-slate-900 text-sm">
              {piece.product_code}
            </span>
            {piece.is_critical && (
              <Badge
                variant="outline"
                className="border-red-500 text-red-700 bg-red-50 text-[11px]"
              >
                Caminho Crítico
              </Badge>
            )}
            <span className="text-xs text-slate-400 ml-auto">
              {piece.orders.length} {piece.orders.length === 1 ? "OP" : "OPs"}
            </span>
          </div>
          <div className="text-xs text-slate-500 mb-1.5">
            {piece.product_desc}
          </div>
          <TimeBar
            planned={piece.planned_hours ?? 0}
            real={piece.real_hours ?? 0}
            remaining={piece.remaining_hours ?? 0}
            compact
          />
        </div>
        <div className="shrink-0 text-slate-400 mt-0.5">
          {isOpen ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </button>

      {isOpen && piece.comment && (
        <div className="mx-4 mb-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs flex gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
          <span className="text-slate-700 whitespace-pre-wrap">
            {piece.comment}
          </span>
        </div>
      )}

      {isOpen && (
        <div className="px-4 pb-4 space-y-2.5">
          {[...piece.orders]
            .sort(
              (a: any, b: any) => Number(b.is_critical) - Number(a.is_critical)
            )
            .map((order: any) => (
              <OrderCard
                key={order.op_id}
                order={order}
                defaultOpen={allOrdersOpen}
              />
            ))}
        </div>
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

interface PrefixGroupListProps {
  groups: PrefixGroup[];
}

type ViewMode = "compact" | "expanded";

function readViewMode(): ViewMode {
  try {
    return (localStorage.getItem("pcp_view_mode") as ViewMode) ?? "compact";
  } catch {
    return "compact";
  }
}

export default function PrefixGroupList({ groups }: PrefixGroupListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(readViewMode);
  const [expandedPrefixes, setExpandedPrefixes] = useState<string[]>([]);
  const [expandedPieces, setExpandedPieces] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (groups.length > 0 && expandedPrefixes.length === 0) {
      setExpandedPrefixes([`prefix-${groups[0].prefix}`]);
    }
  }, [groups]);

  const toggleViewMode = () => {
    if (isPending) return;

    const next: ViewMode = viewMode === "compact" ? "expanded" : "compact";

    startTransition(() => {
      setViewMode(next);

      if (next === "expanded") {
        setExpandedPrefixes(groups.map(g => `prefix-${g.prefix}`));
        setExpandedPieces(
          groups.flatMap(g => g.pieces.map(p => `piece-${p.product_code}`))
        );
      }
    });

    try {
      localStorage.setItem("pcp_view_mode", next);
    } catch {}
  };

  const togglePiece = useCallback((key: string) => {
    setExpandedPieces(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  }, []);

  if (groups.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
        <Package className="w-14 h-14 text-slate-200 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-600 mb-1">
          Nenhuma ordem encontrada
        </h3>
        <p className="text-sm text-slate-400">
          Tente ajustar os filtros para encontrar ordens de produção.
        </p>
      </div>
    );
  }

  const isExpanded = viewMode === "expanded";

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-end gap-2">
        <span className="text-xs text-slate-400">Visualização:</span>
        <button
          type="button"
          onClick={toggleViewMode}
          disabled={isPending}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-200 ${
            isExpanded
              ? "bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-600/30"
              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
          } ${isPending ? "opacity-70 cursor-not-allowed" : ""}`}
        >
          {isPending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Carregando
            </>
          ) : isExpanded ? (
            <>
              <LayoutGrid className="w-3.5 h-3.5" />
              Expandida
            </>
          ) : (
            <>
              <LayoutList className="w-3.5 h-3.5" />
              Compacta
            </>
          )}
        </button>
      </div>

      {/* Groups */}
      <div className="space-y-3">
        {groups.map(group => (
          <div
            key={group.prefix}
            className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-200 hover:shadow-md hover:border-slate-200"
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
                <AccordionTrigger className="px-5 py-4 hover:bg-slate-50 transition-colors [&>svg]:hidden">
                  <div className="flex items-center gap-3 w-full">
                    <div className="p-2 bg-blue-100 rounded-lg shrink-0">
                      <Layers className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <h3 className="font-bold text-slate-900 text-base leading-tight">
                        {group.prefix_name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 flex-wrap">
                        <span>
                          {group.pieces.length}{" "}
                          {group.pieces.length === 1 ? "peça" : "peças"}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span>{group.total_orders} OPs</span>
                        {group.late_count > 0 && (
                          <>
                            <span className="text-slate-300">·</span>
                            <span className="text-red-600 font-semibold">
                              {group.late_count}{" "}
                              {group.late_count === 1
                                ? "atrasada"
                                : "atrasadas"}
                            </span>
                          </>
                        )}
                        {group.critical_count > 0 && (
                          <>
                            <span className="text-slate-300">·</span>
                            <span className="text-amber-600 font-semibold">
                              {group.critical_count}{" "}
                              {group.critical_count === 1
                                ? "crítica"
                                : "críticas"}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400 transition-transform duration-200 group-data-[state=open]:rotate-180 shrink-0" />
                  </div>
                </AccordionTrigger>

                <AccordionContent>
                  <div className="px-5 pb-5 pt-1 space-y-2.5">
                    {group.pieces.map(piece => (
                      <PieceCard
                        key={piece.product_code}
                        piece={piece}
                        expandedPieces={expandedPieces}
                        onToggle={togglePiece}
                        allOrdersOpen={isExpanded}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        ))}
      </div>
    </div>
  );
}
