import * as XLSX from "xlsx";
import { extractPrefix, getPrefixName } from "./prefixMapping";

// Lista de produtos permitidos (tipos de peças de moldes)
const ALLOWED_PRODUCTS = [
  "MOLDE",
  "BLANK",
  "BAFFLE",
  "FUNIL",
  "FUNDO",
  "NECKRING",
  "ANEL DE GUIA",
  "INJETOR",
  "MACHO",
  "PLUG DO BAFFLE",
  "BUCHA DO FUNDO",
  "PLUG DO FUNDO",
  "BUCHA DO MOLDE",
  "EIXO MOTOR",
  "GUIA DA GAVETA",
  "PINO",
  "ALAVANCA AC",
];

/**
 * Verifica se um produto deve ser incluído baseado na descrição
 */
function isAllowedProduct(productDesc?: string): boolean {
  const upperDesc = (productDesc ?? "").toUpperCase().trim();
  return ALLOWED_PRODUCTS.some(allowed => upperDesc.includes(allowed));
}

/**
 * Extrai o número base (contexto) do código do produto
 * Ex: MO-11290-S -> 11290
 */
function extractBaseNumber(productCode: string): string {
  const parts = productCode.split("-");
  if (parts.length >= 2) {
    return parts[1];
  }
  return productCode;
}

interface TableRow {
  DTLASTSTATUSCHANGE: string;
  IDWOHD: string;
  ORDEMPRODUCAO: string;
  STATUS_ORDEM: string;
  STATUS_OPERACAO: string;
  COD_OPERACAO: string;
  COD_GRUPOGERENCIAL: string;
  DESC_GRUPOGERENCIAL: string;
  COD_PRODUTO: string;
  DESC_PRODUTO: string;
  DT_PRAZO: string | number;
  DT_EMISSAO: string | number;
  QUANTIDADE_PLANEJADA: string;
  TMP_TOTAL_PREV_UNID: string;
  QUANTIDADE_REAL: string;
  TMP_TOTAL_REAL_TRAB_SEG: string;
  TMP_TOTAL_REAL_TRAB_MIN: string;
  TMP_TOTAL_REAL_UNID: string;
  QTDREFUGO: string;
  QTDOPERACAO: string;
  SITUACAO: string;
  RECURSO: string;
  TEMPO_SETUP_SEGS: string;
  NAME: string;
  COMENTARIO?: string;
}

export interface Operation {
  code: string;
  desc: string;
  status: string;
  /** Quantidade planejada para esta operação */
  planned_qty: number;
  /** Quantidade real executada nesta operação */
  real_qty: number;
  /** Tempo planejado total em horas (planned_qty * tmp_prev_unid / 60) */
  planned_hours: number;
  /** Tempo real trabalhado em horas */
  real_hours: number;
  /** Tempo restante estimado em horas */
  remaining_hours: number;
}

export interface ProductionOrder {
  op_id: string;
  status: string;
  progress: number;
  deadline: string;
  emission_date: string;
  days_late: number;
  remaining_hours: number;
  /** Total de horas planejadas para a OP */
  planned_hours: number;
  /** Total de horas reais trabalhadas na OP */
  real_hours: number;
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
  /** Total de horas planejadas para a peça */
  planned_hours: number;
  /** Total de horas reais trabalhadas na peça */
  real_hours: number;
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

function parseXLSX(filePath: string): TableRow[] {
  const xlsxModule = (XLSX as any).default || XLSX;
  const workbook = xlsxModule.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = xlsxModule.utils.sheet_to_json(worksheet, { raw: false });
  return jsonData as TableRow[];
}

function parseDate(dateValue: string | number): Date | null {
  if (!dateValue) return null;
  if (typeof dateValue === "number") {
    const excelEpoch = new Date(1899, 11, 30);
    return new Date(excelEpoch.getTime() + dateValue * 86400000);
  }
  const datePart = String(dateValue).split(" ")[0].trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    const [year, month, day] = datePart.split("-");
    return new Date(Number(year), Number(month) - 1, Number(day));
  }
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(datePart)) {
    const [year, month, day] = datePart.split("/");
    return new Date(Number(year), Number(month) - 1, Number(day));
  }
  if (/^\d{2}\/\d{2}\/\d{2,4}$/.test(datePart)) {
    const [day, month, year] = datePart.split("/");
    const fullYear = year.length === 2 ? `20${year}` : year;
    return new Date(Number(fullYear), Number(month) - 1, Number(day));
  }
  return null;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isValidDate(date: Date | null | undefined): date is Date {
  return !!date && !Number.isNaN(date.getTime());
}

function parseNumber(value: string | number | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (!value) return 0;

  const raw = String(value).trim();
  if (!raw) return 0;

  let normalized = raw;
  if (/,\d+$/.test(raw)) {
    normalized = raw.replace(/\./g, "").replace(",", ".");
  } else {
    normalized = raw.replace(/,/g, "");
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function calculateDaysLate(deadline: Date): number {
  if (!isValidDate(deadline)) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadlineCopy = new Date(deadline);
  deadlineCopy.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - deadlineCopy.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : 0;
}

function getOrderStatus(progress: number, daysLate: number): string {
  if (progress >= 100) return "concluido";
  if (daysLate > 0) return "atrasado";
  return "no_prazo";
}

export function processCSV(filePath: string): PrefixGroup[] {
  const rows: TableRow[] = parseXLSX(filePath);
  const filteredRows = rows.filter(row => isAllowedProduct(row.DESC_PRODUTO));

  const allPiecesMap = new Map<string, Piece>();

  // 1. Processar todas as linhas para criar peças e OPs
  filteredRows.forEach(row => {
    const pieceCode = row.COD_PRODUTO;
    const opId = row.ORDEMPRODUCAO;

    if (!allPiecesMap.has(pieceCode)) {
      allPiecesMap.set(pieceCode, {
        product_code: pieceCode,
        product_desc: row.DESC_PRODUTO,
        base_number: extractBaseNumber(pieceCode),
        remaining_hours: 0,
        planned_hours: 0,
        real_hours: 0,
        orders: [],
        is_critical: false,
      } as any);
    }

    const piece = allPiecesMap.get(pieceCode)!;

    const comment = (row.COMENTARIO ?? "").trim();
    if (!piece.comment && comment) {
      piece.comment = comment;
    }

    let order = piece.orders.find(o => o.op_id === opId);
    if (!order) {
      order = {
        op_id: opId,
        name: row.NAME,
        status: "",
        progress: 0,
        deadline: (() => {
          const parsedDeadline = parseDate(row.DT_PRAZO);
          return isValidDate(parsedDeadline)
            ? formatDate(parsedDeadline)
            : formatDate(new Date());
        })(),
        emission_date: (() => {
          const parsedEmission = parseDate(row.DT_EMISSAO);
          if (isValidDate(parsedEmission)) return formatDate(parsedEmission);
          const parsedDeadline = parseDate(row.DT_PRAZO);
          if (isValidDate(parsedDeadline)) return formatDate(parsedDeadline);
          return formatDate(new Date());
        })(),
        days_late: 0,
        remaining_hours: 0,
        planned_hours: 0,
        real_hours: 0,
        operations: [],
        is_critical: false,
        planned_quantity: parseNumber(row.QUANTIDADE_PLANEJADA),
        real_quantity: parseNumber(row.QUANTIDADE_REAL),
        has_missing_pieces: false,
        quantitiesInitialized: false,
      };
      piece.orders.push(order);
    }

    // Adicionar operação se não existir
    if (!order.operations.find(op => op.code === row.COD_OPERACAO)) {
      const plannedQty = parseNumber(row.QUANTIDADE_PLANEJADA);
      const realQty = parseNumber(row.QUANTIDADE_REAL);
      const timePrevUnit = parseNumber(row.TMP_TOTAL_PREV_UNID);
      // TMP_TOTAL_REAL_UNID = tempo real por unidade (em minutos)
      const timeRealUnit = parseNumber(row.TMP_TOTAL_REAL_UNID);
      // TMP_TOTAL_REAL_TRAB_MIN = tempo real trabalhado total em minutos
      const timeRealTrabMin = parseNumber(row.TMP_TOTAL_REAL_TRAB_MIN);

      const operationStatusRaw = (row.STATUS_OPERACAO ?? "")
        .trim()
        .toUpperCase();

      let operationStatus: "NAO_INICIADA" | "EM_ANDAMENTO" | "CONCLUIDA" =
        "NAO_INICIADA";
      let opRemainingHours = 0;

      // Horas planejadas = qty_planejada * tempo_previsto_por_unidade / 60
      const opPlannedHours = (plannedQty * timePrevUnit) / 60;

      // Horas reais = tempo_real_trabalhado_total em minutos / 60
      // Usamos TMP_TOTAL_REAL_TRAB_MIN como fonte mais direta do tempo real
      let opRealHours = timeRealTrabMin / 60;
      // Fallback: se não tiver TRAB_MIN, calcular via qty_real * tempo_real_por_unidade
      if (opRealHours === 0 && timeRealUnit > 0) {
        opRealHours = (realQty * timeRealUnit) / 60;
      }

      if (
        operationStatusRaw.includes("FINALIZ") ||
        operationStatusRaw.includes("CONCLUID") ||
        operationStatusRaw.includes("ENCERRAD")
      ) {
        operationStatus = "CONCLUIDA";
        opRemainingHours = 0;
      } else if (
        operationStatusRaw === "LIBERADA" ||
        operationStatusRaw.includes("NAO INICI")
      ) {
        operationStatus = "NAO_INICIADA";
        opRemainingHours = opPlannedHours;
      } else if (realQty >= plannedQty && plannedQty > 0) {
        operationStatus = "CONCLUIDA";
        opRemainingHours = 0;
      } else if (realQty > 0 && plannedQty > 0) {
        operationStatus = "EM_ANDAMENTO";
        opRemainingHours = ((plannedQty - realQty) * timePrevUnit) / 60;
      } else {
        operationStatus = "NAO_INICIADA";
        opRemainingHours = opPlannedHours;
      }

      if (!order.quantitiesInitialized) {
        order.planned_quantity = plannedQty;
        order.real_quantity = realQty;
        order.quantitiesInitialized = true;
      }

      order.operations.push({
        code: row.COD_OPERACAO,
        desc: row.DESC_GRUPOGERENCIAL,
        status: operationStatus,
        planned_qty: plannedQty,
        real_qty: realQty,
        planned_hours: Math.round(opPlannedHours * 10) / 10,
        real_hours: Math.round(opRealHours * 10) / 10,
        remaining_hours: Math.round(opRemainingHours * 10) / 10,
      });

      order.remaining_hours += opRemainingHours;
      order.planned_hours += opPlannedHours;
      order.real_hours += opRealHours;
    }
  });

  // 2. Finalizar cálculos de progresso e status
  allPiecesMap.forEach(piece => {
    piece.remaining_hours = 0;
    piece.planned_hours = 0;
    piece.real_hours = 0;

    piece.orders.forEach(order => {
      const completedOps = order.operations.filter(
        op => op.status === "CONCLUIDA"
      ).length;
      order.progress =
        order.operations.length > 0
          ? Math.round((completedOps / order.operations.length) * 100)
          : 0;

      const deadlineDate = new Date(order.deadline);
      const daysLate = calculateDaysLate(deadlineDate);
      order.days_late = daysLate;
      order.status = getOrderStatus(order.progress, daysLate);
      order.remaining_hours = Math.round(order.remaining_hours * 10) / 10;
      order.planned_hours = Math.round(order.planned_hours * 10) / 10;
      order.real_hours = Math.round(order.real_hours * 10) / 10;

      piece.remaining_hours += order.remaining_hours;
      piece.planned_hours += order.planned_hours;
      piece.real_hours += order.real_hours;

      order.is_critical = false;
      const hasStarted = order.operations.some(
        op => op.status !== "NAO_INICIADA"
      );
      order.has_missing_pieces =
        hasStarted && order.real_quantity < order.planned_quantity;
    });

    piece.remaining_hours = Math.round(piece.remaining_hours * 10) / 10;
    piece.planned_hours = Math.round(piece.planned_hours * 10) / 10;
    piece.real_hours = Math.round(piece.real_hours * 10) / 10;

    piece.orders.sort(
      (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    );
  });

  // 3. APLICAR REGRA DE CRITICIDADE POR CONTEXTO (NÚMERO BASE)
  const contextMap = new Map<string, Piece[]>();
  allPiecesMap.forEach(piece => {
    const baseNumber = (piece as any).base_number ?? "";
    if (!contextMap.has(baseNumber)) {
      contextMap.set(baseNumber, []);
    }
    contextMap.get(baseNumber)!.push(piece);
  });

  contextMap.forEach(piecesInContext => {
    let criticalPiece: Piece | null = null;
    let maxHours = 0;

    piecesInContext.forEach(piece => {
      if (piece.remaining_hours > maxHours) {
        maxHours = piece.remaining_hours;
        criticalPiece = piece;
      }
    });

    if (criticalPiece && (criticalPiece as Piece).remaining_hours > 0) {
      (criticalPiece as Piece).is_critical = true;
    }
  });

  // 4. AGRUPAR VISUALMENTE POR PREFIXO PARA A UI
  const prefixGroupsMap = new Map<string, PrefixGroup>();

  allPiecesMap.forEach(piece => {
    const prefix = extractPrefix(piece.product_code);
    if (!prefixGroupsMap.has(prefix)) {
      prefixGroupsMap.set(prefix, {
        prefix,
        prefix_name: getPrefixName(prefix),
        total_orders: 0,
        critical_count: 0,
        late_count: 0,
        pieces: [],
      });
    }

    const group = prefixGroupsMap.get(prefix)!;
    group.pieces.push(piece);
    group.total_orders += piece.orders.length;
    if (piece.is_critical) group.critical_count++;
    group.late_count += piece.orders.filter(o => o.days_late > 0).length;
  });

  // 5. Ordenação final
  const result = Array.from(prefixGroupsMap.values()).map(group => {
    group.pieces.sort((a, b) => {
      if (a.is_critical && !b.is_critical) return -1;
      if (!a.is_critical && b.is_critical) return 1;
      return b.remaining_hours - a.remaining_hours;
    });
    return group;
  });

  return result.sort((a, b) => {
    if (b.late_count !== a.late_count) return b.late_count - a.late_count;
    return b.total_orders - a.total_orders;
  });
}