import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Package, AlertTriangle, TrendingUp, CheckCircle } from "lucide-react";
import PrefixGroupList from "@/components/PrefixGroupList";
import { AlertPanel } from "@/components/AlertPanel";
import { FilterBar } from "@/components/FilterBar";
import { cn } from "@/lib/utils";

interface Operation {
  code: string;
  desc: string;
  status: string;
}

export interface ProductionOrder {
  op_id: string;
  status: string;
  progress: number;
  deadline: string;
  emission_date: string;
  days_late: number;
  remaining_hours: number;
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

export default function Home() {
  const [prefixGroups, setPrefixGroups] = useState<PrefixGroup[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<PrefixGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileProcessed = (data: PrefixGroup[]) => {
    setPrefixGroups(data);
    setFilteredGroups(data);
    setIsLoading(false);
  };

  const handleFileSelected = () => {
    setIsLoading(true);
  };

  const handleReset = () => {
    setPrefixGroups([]);
    setFilteredGroups([]);
  };

  const handleFilterChange = (filtered: PrefixGroup[]) => {
    setFilteredGroups(filtered);
  };

  // Calcular estatísticas gerais
  const totalOrders = prefixGroups.reduce((sum, group) => sum + group.total_orders, 0);
  const totalLate = prefixGroups.reduce((sum, group) => sum + group.late_count, 0);
  const totalCritical = prefixGroups.reduce((sum, group) => sum + group.critical_count, 0);
    // Todas as OPs
  const allOrders = prefixGroups.flatMap(group =>
    group.pieces.flatMap(piece => piece.orders)
  );

  const completedOrders = allOrders.filter(
    order => order.status === 'concluido' || order.progress >= 100
  ).length;

  const completionRate =
    allOrders.length > 0
      ? Math.round((completedOrders / allOrders.length) * 100)
      : 0;


  function getCompletionColor(rate: number) {
    if (rate < 50) return "text-red-400";
    if (rate < 80) return "text-amber-400";
    return "text-emerald-400";
  }
    
  if (prefixGroups.length === 0) {
    return (
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
                Faça upload do relatório de apontamento de produção para visualizar o status das
                ordens, identificar gargalos e acompanhar o caminho crítico de cada peça.
              </p>
            </div>

            <FileUpload
              onFileProcessed={handleFileProcessed}
              onFileSelected={handleFileSelected}
              isLoading={isLoading}
            />

            <p className="text-center text-sm text-slate-500 mt-6">
              O arquivo Excel (.xlsx) deve conter as colunas: ORDEMPRODUCAO, COD_PRODUTO, STATUS_OPERACAO, etc.
            </p>
          </div>
        </main>

        <footer className="bg-slate-900 text-slate-400 py-4">
          <div className="container text-center text-sm">
            Desenvolvido para otimizar o controle de produção de moldes
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Sentinela PCP</h1>
                <p className="text-slate-300 text-xs">Monitoramento de Ordens de Produção</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 bg-slate-800 px-3 py-2 rounded-lg">
                  <Package className="w-4 h-4 text-blue-400" />
                  <span className="text-slate-300">Total:</span>
                  <span className="font-bold">{totalOrders}</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-800 px-3 py-2 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-slate-300">Atrasadas:</span>
                  <span className="font-bold text-red-400">{totalLate}</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-800 px-3 py-2 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span className="text-slate-300">Concluídas:</span>
                  
                  {/* Cor interativa */}
                  <span className={cn("font-bold", getCompletionColor(completionRate))}>
                    {completionRate}% <span className="text-slate-400 font-normal">({completedOrders}/{allOrders.length})</span>
                  </span>
                  
                  {/* <span className="font-bold text-emerald-400">
                    {completionRate}% <span className="text-slate-400 font-normal">({completedOrders}/{allOrders.length})</span>
                  </span> */}

                </div>
                <div className="flex items-center gap-2 bg-slate-800 px-3 py-2 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  <span className="text-slate-300">Peças Críticas:</span>
                  <span className="font-bold text-amber-400">{totalCritical}</span>
                </div>
              </div>
              <AlertPanel groups={prefixGroups} />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container py-6">
        <Tabs defaultValue="dashboard" className="w-full">
          <div className="flex items-center justify-between mb-6">
            <TabsList className="bg-white shadow-sm">
              <TabsTrigger value="dashboard" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="alerts" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                Alertas
              </TabsTrigger>
            </TabsList>

            <button
              onClick={handleReset}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg shadow-sm border border-slate-200 transition-colors text-sm font-medium"
            >
              Novo Upload
            </button>
          </div>

          <TabsContent value="dashboard" className="space-y-6">
            <Card className="p-6 bg-white shadow-sm">
              <FilterBar
                groups={prefixGroups}
                onFilterChange={handleFilterChange}
              />
            </Card>

            <PrefixGroupList groups={filteredGroups} />
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <div className="grid gap-4">
              {prefixGroups.flatMap(group =>
                group.pieces.flatMap(piece =>
                  piece.orders
                    .filter(order => order.status === 'atrasado' || order.days_late)
                    .map(order => (
                      <Card key={`${group.prefix}-${piece.product_code}-${order.op_id}`} className="p-4 bg-white shadow-sm border-l-4 border-red-500">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
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
                            <p className="text-sm text-slate-600">
                              {piece.product_desc}
                            </p>
                            <div className="flex items-center gap-4 mt-3 text-sm">
                              <span className="text-slate-600">
                                Prazo: <span className="font-medium text-slate-900">{new Date(order.deadline).toLocaleDateString('pt-BR')}</span>
                              </span>
                              {order.days_late && (
                                <span className="text-red-600 font-medium">
                                  {order.days_late} {order.days_late === 1 ? 'dia' : 'dias'} de atraso
                                </span>
                              )}
                              <span className="text-slate-600">
                                Progresso: <span className="font-medium text-slate-900">{order.progress}%</span>
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
  );
}
