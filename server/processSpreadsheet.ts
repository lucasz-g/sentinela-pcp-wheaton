import { readFileSync } from "fs";
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
function isAllowedProduct(productDesc: string): boolean {
  const upperDesc = productDesc.toUpperCase().trim();
  return ALLOWED_PRODUCTS.some(allowed => upperDesc.includes(allowed));
}

/**
 * Extrai o número base (contexto) do código do produto
 * Ex: MO-11290-S -> 11290
 */
function extractBaseNumber(productCode: string): string {
  const parts = productCode.split("-");
  if (parts.length >= 2) return parts[1];
  return productCode; // fallback
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
  NAME: string;
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
}

interface Operation {
  code: string;
  desc: string;
  status: string;
}

interface ProductionOrder {
  op_id: string;
  status: string;
  progress: number;
  deadline: Date;
  emission_date: string;
  days_late: number;
  remaining_hours: number;
  operations: Operation[];
  is_critical: boolean;
  planned_quantity: number;
  real_quantity: number;
  name: string;
  has_missing_pieces: boolean;
}

interface Piece {
  product_code: string;
  product_desc: string;
  base_number: string; // contexto lógico
  remaining_hours: number;
  orders: ProductionOrder[];
  is_critical: boolean;
}

interface PrefixGroup {
  prefix: string;
  prefix_name: string;
  total_orders: number;
  critical_count: number;
  late_count: number;
  pieces: Piece[];
}

/**
 * Parse XLSX e retorna um array de TableRow
 */
function parseXLSX(filePath: string): TableRow[] {
  const xlsxModule = (XLSX as any).default || XLSX;
  const workbook = xlsxModule.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = xlsxModule.utils.sheet_to_json(worksheet, { raw: false });
  return jsonData as TableRow[];
}

/**
 * Converte valor de data do XLSX em Date
 */
function parseDate(dateValue: string | number): Date | null {
  if (!dateValue) return null;

  if (typeof dateValue === "number") {
    const excelEpoch = new Date(1899, 11, 30);
    return new Date(excelEpoch.getTime() + dateValue * 86400000);
  }

  const datePart = dateValue.split(" ")[0];

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

function calculateDaysLate(deadline: Date): number {
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

/**
 * Processa CSV/XLSX e retorna PrefixGroups
 */
export function processCSV(filePath: string): PrefixGroup[] {
  const rows: TableRow[] = parseXLSX(filePath);

  // Filtra apenas produtos permitidos
  const filteredRows = rows.filter(row => isAllowedProduct(row.DESC_PRODUTO));

  const allPiecesMap = new Map<string, Piece>();

  // 1. Criar peças e operações
  filteredRows.forEach(row => {
    const pieceCode = row.COD_PRODUTO;
    const opId = row.ORDEMPRODUCAO;

    if (!allPiecesMap.has(pieceCode)) {
      allPiecesMap.set(pieceCode, {
        product_code: pieceCode,
        product_desc: row.DESC_PRODUTO,
        base_number: extractBaseNumber(pieceCode),
        remaining_hours: 0,
        orders: [],
        is_critical: false,
      });
    }

    const piece = allPiecesMap.get(pieceCode)!;

    let order = piece.orders.find(o => o.op_id === opId);
    if (!order) {
      order = {
        op_id: opId,
        name: row.NAME,
        status: "",
        progress: 0,
        deadline: parseDate(row.DT_PRAZO)!,
        emission_date: formatDate(parseDate(row.DT_EMISSAO)!),
        days_late: 0,
        remaining_hours: 0,
        operations: [],
        is_critical: false,
        planned_quantity: parseFloat(row.QUANTIDADE_PLANEJADA) || 0,
        real_quantity: parseFloat(row.QUANTIDADE_REAL) || 0,
        has_missing_pieces: false,
      };
      piece.orders.push(order);
    }

    // Adiciona operação sem duplicatas
    if (!order.operations.find(op => op.code === row.COD_OPERACAO)) {
      const plannedQty = parseFloat(row.QUANTIDADE_PLANEJADA) || 0;
      const realQty = parseFloat(row.QUANTIDADE_REAL) || 0;
      const timePrevUnit = parseFloat(row.TMP_TOTAL_PREV_UNID) || 0;

      let operationStatus: "NAO_INICIADA" | "EM_ANDAMENTO" | "CONCLUIDA" =
        "NAO_INICIADA";
      let opRemainingHours = 0;

      if (row.STATUS_OPERACAO === "LIBERADA") {
        operationStatus = "NAO_INICIADA";
        opRemainingHours = (plannedQty * timePrevUnit) / 60;
      } else if (row.STATUS_OPERACAO === "INTERROMPIDA") {
        if (realQty < plannedQty) {
          operationStatus = "EM_ANDAMENTO";
          opRemainingHours = ((plannedQty - realQty) * timePrevUnit) / 60;
        } else {
          operationStatus = "CONCLUIDA";
        }
      }

      if (order.planned_quantity === 0 && order.real_quantity === 0) {
        order.planned_quantity = plannedQty;
        order.real_quantity = realQty;
      }

      order.operations.push({
        code: row.COD_OPERACAO,
        desc: row.DESC_GRUPOGERENCIAL,
        status: operationStatus,
      });

      order.remaining_hours += opRemainingHours;
    }
  });

  // 2. Finalizar cálculos de progresso e status
  allPiecesMap.forEach(piece => {
    piece.remaining_hours = 0;

    piece.orders.forEach(order => {
      const completedOps = order.operations.filter(
        op => op.status === "CONCLUIDA"
      ).length;
      order.progress =
        order.operations.length > 0
          ? Math.round((completedOps / order.operations.length) * 100)
          : 0;

      const daysLate = calculateDaysLate(order.deadline);
      order.days_late = daysLate;
      order.status = getOrderStatus(order.progress, daysLate);

      order.remaining_hours = Math.round(order.remaining_hours * 10) / 10;
      piece.remaining_hours += order.remaining_hours;

      order.is_critical = false; // OP nunca é crítica
      const hasStartedOperation = order.operations.some(
        op => op.status === "CONCLUIDA"
      );
      order.has_missing_pieces =
        hasStartedOperation && order.real_quantity < order.planned_quantity;
    });

    piece.remaining_hours = Math.round(piece.remaining_hours * 10) / 10;
    piece.orders.sort(
      (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    );
  });

  // 3. Criticidade por contexto (número base)
  const contextMap = new Map<string, Piece[]>();
  allPiecesMap.forEach(piece => {
    if (!contextMap.has(piece.base_number))
      contextMap.set(piece.base_number, []);
    contextMap.get(piece.base_number)!.push(piece);
  });

  contextMap.forEach(piecesInContext => {
    let criticalPiece: Piece | null = null;
    let maxHours = 0;

    for (const piece of piecesInContext) {
      if (piece.remaining_hours > maxHours) {
        maxHours = piece.remaining_hours;
        criticalPiece = piece;
      }
    }

    if (criticalPiece !== null && criticalPiece.remaining_hours > 0) {
      criticalPiece.is_critical = true;
    }
  });

  // 4. Agrupar por prefixo
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
