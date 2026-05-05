import { useState, useEffect } from "react";
import { FileUpload } from "@/components/FileUpload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import {
  Package,
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  RefreshCw,
  UploadCloud,
} from "lucide-react";
import PrefixGroupList from "@/components/PrefixGroupList";
import { FilterBar } from "@/components/FilterBar";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { DashboardSkeleton, ButtonSpinner } from "@/components/Skeletons";
import { cn } from "@/lib/utils";

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

export interface ProductionOrder {
  op_id: string;
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
  name: string;
  has_missing_pieces: boolean;
  planned_quantity: number;
  real_quantity: number;
  quantitiesInitialized: boolean;
}

export interface Piece {
  product_code: string;
  product_desc: string;
  remaining_hours: number;
  planned_hours?: number;
  real_hours?: number;
  orders: ProductionOrder[];
  is_critical?: boolean;
  comment?: string;
}

export interface PrefixGroup {
  prefix: string;
  prefix_name: string;
  total_orders: number;
  critical_count: number;
  late_count: number;
  pieces: Piece[];
}

// ─── Loading states ───────────────────────────────────────────────────────────

type LoadingMode = "idle" | "upload" | "restore" | "reset";

// ─── Persistence ─────────────────────────────────────────────────────────────

const STORAGE_KEY = "pcp_last_data";
const STORAGE_TS_KEY = "pcp_last_data_ts";

function saveToStorage(data: PrefixGroup[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    localStorage.setItem(STORAGE_TS_KEY, new Date().toISOString());
  } catch {}
}

function loadFromStorage(): { data: PrefixGroup[]; timestamp: string | null } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return { data: JSON.parse(raw), timestamp: localStorage.getItem(STORAGE_TS_KEY) };
  } catch {
    return null;
  }
}

function clearStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_TS_KEY);
  } catch {}
}

function fmtTimestamp(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Home() {
  const [prefixGroups, setPrefixGroups] = useState<PrefixGroup[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<PrefixGroup[]>([]);
  const [isFiltered, setIsFiltered] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Loading orchestration
  const [loadingMode, setLoadingMode] = useState<LoadingMode>("idle");
  // skeleton shown after overlay dismisses while React re-renders lists
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);

  const isOverlayVisible = loadingMode !== "idle";

  // ── Restore from localStorage on mount ──────────────────────────────────────
  useEffect(() => {
    const saved = loadFromStorage();
    if (saved && saved.data.length > 0) {
      setLoadingMode("restore");
      // small artificial delay so the overlay is actually seen
      setTimeout(() => {
        setPrefixGroups(saved.data);
        setFilteredGroups(saved.data);
        setLastUpdated(saved.timestamp);
        setLoadingMode("idle");
        // brief skeleton flash while React paints the real list
        setShowSkeleton(true);
        setTimeout(() => setShowSkeleton(false), 350);
      }, 900);
    }
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleFileSelected = () => {
    setLoadingMode("upload");
  };

  const handleFileProcessed = (data: PrefixGroup[]) => {
    // Give the overlay a moment to feel "real" before swapping content
    setTimeout(() => {
      setPrefixGroups(data);
      setFilteredGroups(data);
      setIsFiltered(false);
      setLastUpdated(new Date().toISOString());
      saveToStorage(data);
      setLoadingMode("idle");
      setShowSkeleton(true);
      setTimeout(() => setShowSkeleton(false), 400);
    }, 600);
  };

  const handleReset = async () => {
    setResetBusy(true);
    setLoadingMode("reset");
    await new Promise(r => setTimeout(r, 700));
    clearStorage();
    setPrefixGroups([]);
    setFilteredGroups([]);
    setIsFiltered(false);
    setLastUpdated(null);
    setLoadingMode("idle");
    setResetBusy(false);
  };

  const handleFilterChange = (filtered: PrefixGroup[]) => {
    setShowSkeleton(true);
    setFilteredGroups(filtered);
    setIsFiltered(true);
    setTimeout(() => setShowSkeleton(false), 300);
  };

  // ── Stats ─────────────────────────────────────────────────────────────────

  const statsSource = isFiltered ? filteredGroups : prefixGroups;
  const allOrders = statsSource.flatMap(g => g.pieces.flatMap(p => p.orders));
  const totalOrders = allOrders.length;
  const totalLate = allOrders.filter(o => o.status === "atrasado" || (o.days_late ?? 0) > 0).length;
  const totalCritical = statsSource.reduce(
    (sum, g) => sum + g.pieces.filter(p => p.is_critical).length,
    0
  );
  const completedOrders = allOrders.filter(
    o => o.status === "concluido" || o.progress >= 100
  ).length;
  const completionRate =
    allOrders.length > 0 ? Math.round((completedOrders / allOrders.length) * 100) : 0;

  function completionColor(rate: number) {
    if (rate < 50) return "text-red-400";
    if (rate < 80) return "text-amber-400";
    return "text-emerald-400";
  }

  // ── Welcome screen ────────────────────────────────────────────────────────

  if (prefixGroups.length === 0 && loadingMode === "idle") {
    return (
      <>
        <LoadingOverlay visible={false} />
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
          <header className="bg-slate-900 text-white shadow-lg">
            <div className="container py-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Sentinela PCP</h1>
                  <p className="text-slate-300 text-sm">Monitoramento de Ordens de Produção</p>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 flex items-center justify-center p-6">
            <div className="w-full max-w-2xl">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-900 mb-3">
                  Bem-vindo ao Sentinela PCP
                </h2>
                <p className="text-slate-600 text-lg">
                  Faça upload do relatório de apontamento de produção para visualizar o status
                  das ordens, identificar gargalos e acompanhar o caminho crítico de cada peça.
                </p>
              </div>

              <FileUpload
                onFileProcessed={handleFileProcessed}
                onFileSelected={handleFileSelected}
                isLoading={false}
              />

              <p className="text-center text-sm text-slate-500 mt-6">
                O arquivo Excel (.xlsx) deve conter as colunas: ORDEMPRODUCAO, COD_PRODUTO,
                STATUS_OPERACAO, etc.
              </p>
            </div>
          </main>

          <footer className="bg-slate-900 text-slate-400 py-4">
            <div className="container text-center text-sm">
              Desenvolvido para otimizar o controle de produção de moldes
            </div>
          </footer>
        </div>
      </>
    );
  }

  // ── Main dashboard ────────────────────────────────────────────────────────

  return (
    <>
      {/* Full-screen overlay for upload / restore / reset */}
      <LoadingOverlay visible={isOverlayVisible} mode={loadingMode === "idle" ? "upload" : loadingMode} />

      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
        {/* ── Header ── */}
        <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
          <div className="container py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 shrink-0">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Sentinela PCP</h1>
                  <p className="text-slate-300 text-xs">Monitoramento de Ordens de Produção</p>
                </div>
              </div>

              {/* Stats pills */}
              <div className="hidden md:flex items-center gap-3 text-sm flex-wrap justify-end">
                <StatPill
                  icon={<Package className="w-4 h-4 text-blue-400" />}
                  label="Total"
                  value={String(totalOrders)}
                />
                <StatPill
                  icon={<AlertTriangle className="w-4 h-4 text-red-400" />}
                  label="Atrasadas"
                  value={String(totalLate)}
                  valueClass="text-red-400"
                />
                <StatPill
                  icon={<CheckCircle className="w-4 h-4 text-emerald-400" />}
                  label="Concluídas"
                  value={`${completionRate}%`}
                  suffix={`(${completedOrders}/${allOrders.length})`}
                  valueClass={completionColor(completionRate)}
                />
                <StatPill
                  icon={<TrendingUp className="w-4 h-4 text-amber-400" />}
                  label="Críticas"
                  value={String(totalCritical)}
                  valueClass="text-amber-400"
                />
              </div>
            </div>
          </div>
        </header>

        {/* ── Main ── */}
        <main className="flex-1 container py-6">
          <Tabs defaultValue="dashboard" className="w-full">
            {/* Tab bar + actions */}
            <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
              <TabsList className="bg-white shadow-sm">
                <TabsTrigger
                  value="dashboard"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  Dashboard
                </TabsTrigger>
                <TabsTrigger
                  value="alerts"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  Alertas
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-3">
                {/* Timestamp */}
                {lastUpdated && (
                  <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
                    <RefreshCw className="w-3 h-3" />
                    {fmtTimestamp(lastUpdated)}
                  </div>
                )}

                {/* Reset / new upload button */}
                <button
                  onClick={handleReset}
                  disabled={resetBusy}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200",
                    resetBusy
                      ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                      : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm hover:shadow"
                  )}
                >
                  {resetBusy ? (
                    <>
                      <ButtonSpinner className="w-3.5 h-3.5 text-slate-400" />
                      Limpando...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-3.5 h-3.5" />
                      Novo Upload
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Dashboard tab */}
            <TabsContent value="dashboard" className="space-y-6">
              <Card className="p-6 bg-white shadow-sm">
                <FilterBar
                  groups={prefixGroups}
                  onFilterChange={handleFilterChange}
                />
              </Card>

              {showSkeleton ? (
                <DashboardSkeleton />
              ) : (
                <div className="animate-in fade-in duration-300">
                  <PrefixGroupList groups={filteredGroups} />
                </div>
              )}
            </TabsContent>

            {/* Alerts tab */}
            <TabsContent value="alerts" className="space-y-6">
              <div className="grid gap-4">
                {prefixGroups.flatMap(group =>
                  group.pieces.flatMap(piece =>
                    piece.orders
                      .filter(order => order.status === "atrasado" || order.days_late)
                      .map(order => (
                        <Card
                          key={`${group.prefix}-${piece.product_code}-${order.op_id}`}
                          className="p-4 bg-white shadow-sm border-l-4 border-red-500"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
                                  URGENTE
                                </span>
                                <span className="text-sm text-slate-600">
                                  {group.prefix_name} → {piece.product_code}
                                </span>
                              </div>
                              <h3 className="font-semibold text-slate-900 mb-1">
                                OP {order.op_id}
                              </h3>
                              <p className="text-sm text-slate-600">{piece.product_desc}</p>
                              <div className="flex items-center gap-4 mt-3 text-sm flex-wrap">
                                <span className="text-slate-600">
                                  Prazo:{" "}
                                  <span className="font-medium text-slate-900">
                                    {new Date(order.deadline).toLocaleDateString("pt-BR")}
                                  </span>
                                </span>
                                {order.days_late ? (
                                  <span className="text-red-600 font-medium">
                                    {order.days_late}{" "}
                                    {order.days_late === 1 ? "dia" : "dias"} de atraso
                                  </span>
                                ) : null}
                                <span className="text-slate-600">
                                  Progresso:{" "}
                                  <span className="font-medium text-slate-900">
                                    {order.progress}%
                                  </span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))
                  )
                )}
              </div>
            </TabsContent>
          </Tabs>
        </main>

        <footer className="bg-slate-900 text-slate-400 py-4 mt-8">
          <div className="container text-center text-sm">
            Desenvolvido para otimizar o controle de produção de moldes
          </div>
        </footer>
      </div>
    </>
  );
}

// ─── StatPill ─────────────────────────────────────────────────────────────────

function StatPill({
  icon,
  label,
  value,
  suffix,
  valueClass = "font-bold",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  suffix?: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center gap-2 bg-slate-800 px-3 py-2 rounded-lg">
      {icon}
      <span className="text-slate-300">{label}:</span>
      <span className={valueClass}>{value}</span>
      {suffix && <span className="text-slate-400 font-normal">{suffix}</span>}
    </div>
  );
}
