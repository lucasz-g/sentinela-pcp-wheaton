import { useState, useEffect } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type { PrefixGroup } from "@/pages/Home";

interface FilterBarProps {
  groups: PrefixGroup[];
  onFilterChange: (filtered: PrefixGroup[]) => void;
}

export function FilterBar({ groups, onFilterChange }: FilterBarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("deadline");
  const [emissionFrom, setEmissionFrom] = useState<string>("");
  const [emissionTo, setEmissionTo] = useState<string>("");
  const [deadlineFrom, setDeadlineFrom] = useState<string>("");
  const [deadlineTo, setDeadlineTo] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState("all");

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setSortBy("deadline");
    setTypeFilter("all");
  };

  const hasActiveFilters =
    searchTerm ||
    statusFilter !== "all" ||
    sortBy !== "deadline" ||
    typeFilter !== "all";

  // Contar resultados
  const [filteredResults, setFilteredResults] = useState(0);
  const totalResults = groups.reduce(
    (sum, group) =>
      sum + group.pieces.reduce((pSum, piece) => pSum + piece.orders.length, 0),
    0
  );

  useEffect(() => {
    let filtered = JSON.parse(JSON.stringify(groups)) as PrefixGroup[];

    // FILTROS: busca, status, datas (igual seu código)

    // Filtrar por busca
    if (searchTerm) {
      filtered = filtered
        .map(group => ({
          ...group,
          pieces: group.pieces
            .map(piece => ({
              ...piece,
              orders: piece.orders.filter(
                order =>
                  piece.product_code
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                  piece.product_desc
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                  order.op_id.includes(searchTerm)
              ),
            }))
            .filter(piece => piece.orders.length > 0),
        }))
        .filter(group => group.pieces.length > 0);
    }

    // Filtrar por status
    if (statusFilter !== "all") {
      filtered = filtered
        .map(group => ({
          ...group,
          pieces: group.pieces
            .map(piece => ({
              ...piece,
              orders: piece.orders.filter(
                order => order.status === statusFilter
              ),
            }))
            .filter(piece => piece.orders.length > 0),
        }))
        .filter(group => group.pieces.length > 0);
    }

    // Filtro de datas
    filtered = filtered
      .map(group => ({
        ...group,
        pieces: group.pieces
          .map(piece => ({
            ...piece,
            orders: piece.orders.filter(order => {
              const emission = new Date(order.emission_date);
              const deadline = new Date(order.deadline);

              const emissionValid =
                (!emissionFrom || emission >= new Date(emissionFrom)) &&
                (!emissionTo || emission <= new Date(emissionTo));

              const deadlineValid =
                (!deadlineFrom || deadline >= new Date(deadlineFrom)) &&
                (!deadlineTo || deadline <= new Date(deadlineTo));

              return emissionValid && deadlineValid;
            }),
          }))
          .filter(piece => piece.orders.length > 0),
      }))
      .filter(group => group.pieces.length > 0);

    // Filtrar por tipo (NAME)
    if (typeFilter !== "all") {
      filtered = filtered
        .map(group => ({
          ...group,
          pieces: group.pieces
            .map(piece => ({
              ...piece,
              orders: piece.orders.filter(
                order => (order.name ?? "").trim() === typeFilter
              ),
            }))
            .filter(piece => piece.orders.length > 0),
        }))
        .filter(group => group.pieces.length > 0);
    }

    // Ordenar
    filtered.forEach(group => {
      group.pieces.forEach(piece => {
        piece.orders.sort((a, b) => {
          switch (sortBy) {
            case "deadline":
              return (
                new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
              );
            case "progress":
              return a.progress - b.progress;
            case "status":
              const statusOrder = { atrasado: 0, no_prazo: 1, concluido: 2 };
              return (
                statusOrder[a.status as keyof typeof statusOrder] -
                statusOrder[b.status as keyof typeof statusOrder]
              );
            default:
              return 0;
          }
        });
      });
    });

    // Atualiza estado do filtro
    onFilterChange(filtered);

    // Atualiza quantidade de ordens filtradas
    const filteredCount = filtered.reduce(
      (sum, group) =>
        sum +
        group.pieces.reduce((pSum, piece) => pSum + piece.orders.length, 0),
      0
    );
    setFilteredResults(filteredCount);
  }, [
    searchTerm,
    statusFilter,
    sortBy,
    emissionFrom,
    emissionTo,
    deadlineFrom,
    typeFilter,
    deadlineTo,
    groups,
  ]);

  const typeOptions = Array.from(
    new Set(
      groups
        .flatMap(g => g.pieces)
        .flatMap(p => p.orders)
        .map(o => (o.name ?? "").trim())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b, "pt-BR"));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <SlidersHorizontal className="w-5 h-5 text-slate-600" />
        <h3 className="font-semibold text-slate-900">Filtros e Busca</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por produto..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Todos os Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="atrasado">Atrasado</SelectItem>
            <SelectItem value="no_prazo">No Prazo</SelectItem>
            <SelectItem value="concluido">Concluído</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger>
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="deadline">Prazo (Urgente Primeiro)</SelectItem>
            <SelectItem value="progress">Progresso</SelectItem>
            <SelectItem value="status">Status</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Todos os Tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            {typeOptions.map(t => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {/* Linha 1: Emissão */}
        <div className="flex items-end gap-4">
          <div className="flex flex-col">
            <label className="text-xs font-medium text-slate-600">
              Emissão De
            </label>
            <Input
              type="date"
              value={emissionFrom}
              onChange={e => setEmissionFrom(e.target.value)}
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-medium text-slate-600">
              Emissão Até
            </label>
            <Input
              type="date"
              value={emissionTo}
              onChange={e => setEmissionTo(e.target.value)}
            />
          </div>
        </div>

        {/* Linha 2: Prazo */}
        <div className="flex items-end gap-4">
          <div className="flex flex-col">
            <label className="text-xs font-medium text-slate-600">
              Prazo De
            </label>
            <Input
              type="date"
              value={deadlineFrom}
              onChange={e => setDeadlineFrom(e.target.value)}
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-medium text-slate-600">
              Prazo Até
            </label>
            <Input
              type="date"
              value={deadlineTo}
              onChange={e => setDeadlineTo(e.target.value)}
            />
          </div>
        </div>

        {/* Linha 3: Botão Buscar */}
        {/* <div className="flex justify-start md:justify-start">
          <Button
            onClick={handleApplyDateFilter}
            className="mt-2"
          >
            Buscar
          </Button>
        </div> */}
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600">
          Exibindo{" "}
          <span className="font-semibold text-slate-900">
            {filteredResults}
          </span>{" "}
          de{" "}
          <span className="font-semibold text-slate-900">{totalResults}</span>{" "}
          ordens
        </span>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="text-slate-600 hover:text-slate-900"
          >
            <X className="w-4 h-4 mr-1" />
            Limpar Filtros
          </Button>
        )}
      </div>
    </div>
  );
}
