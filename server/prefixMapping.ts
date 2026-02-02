/**
 * Mapeamento de prefixos baseado no arquivo de Padronizações DTP
 * 
 * Cada prefixo representa um TIPO de componente de molde
 */

export const PREFIX_NAMES: Record<string, string> = {
  'MO': 'Moldes',
  'AG': 'Anéis de Guia',
  'EP': 'Espaçadores',
  'AS': 'Anéis de Centrar',
  'BA': 'Baffles',
  'BI': 'Buchas do Injetor',
  'BL': 'Blanks',
  'BP': 'Bottom Plates',
  'CB': 'Coolers Baffle',
  'CF': 'Coolers Fundo',
  'CM': 'Coolers do Macho',
  'CP': 'Coolers do Plug',
  'FD': 'Fundos',
  'FU': 'Funis',
  'IB': 'Insertos do Blank',
  'IN': 'Injetores',
  'IP': 'Insertos da Pinça',
  'MA': 'Machos',
  'NR': 'Neckrings',
  'PB': 'Plugs do Baffle',
  'PF': 'Plugs do Fundo',
  'PI': 'Pinças',
  'PM': 'Plugs do Molde',
  'BU': 'Buchas do Molde',
  'PN': 'Pinos do Macho',
  'TH': 'Thimbles',
  'ISFU': 'Insertos do Funil',
  'GM': 'Gavetas do Molde',
  'II': 'Insertos do Injetor',
  'IS': 'Injetores Setup',
  'CI': 'Coolers do Injetor',
  'NI': 'Niples',
  'BF': 'Buchas do Funil',
  'BUI': 'Buchas Inferiores do Molde',
  'BUS': 'Buchas Superiores do Molde',
  'HS': 'Hastes Superiores',
  'IM': 'Insertos do Molde',
  'PHS': 'Pinos Haste Superior',
  'PS': 'Pinos do Sensor',
  'IPB': 'Insertos da Pinça 2',
  'IPT': 'Insertos da Pinça 3',
  'MP': 'Machos Prensagem',
  'GG': 'Guias Gaveta',
  'CA': 'Chavetas do Anel',
  'PE': 'Parafusos do Baffle',
  'PG': 'Pinos da Gaveta',
  'AI': 'Anéis do Injetor',
  'AGM': 'Alavancas Gaveta Molde',
  'AM': 'Arruelas Trava Mola',
  'EA': 'Eixos Acionadores',
  'EM': 'Eixos Motores',
  'HA': 'Hastes de Válvula',
  'AC': 'Alavancas de Acionamento',
  'IIS': 'Insertos Injetor Setup',
  'BPS': 'Bases Pinça Setup',
  'IPS': 'Insertos Pinça Setup',
  'PAC': 'Pinos Alavanca Acionamento',
  'GMA': 'Gavetas do Molde Lado A',
  'GMB': 'Gavetas do Molde Lado B',
  'PMA': 'Pistas do Macho',
  'PAG': 'Parafusos da Gaveta',
  'ESF': 'Esferas do Macho',
  'MM': 'Molas do Macho',
  'ML': 'Molas',
  'CHI': 'Chapas do Injetor',
  'MOS': 'Moldes Setup',
  'CTM': 'Cantoneiras Tampa Mola',
  'BTM': 'Bases Tampa Mola',
  'PTM': 'Pinos Tampa Mola',
  'AGMA': 'Alavancas Gaveta Molde Lado A',
  'AGMB': 'Alavancas Gaveta Molde Lado B',
  'TM': 'Tampas Mola',
  'PA': 'Pinos Acionadores do Baffle',
  'SBU': 'Suportes da Bucha do Molde',
  'SP': 'Suportes Macho',
  'CMP': 'Coolers do Macho de Prensagem',
  'EC': 'Eixos da Chapa',
  'PC': 'Parafusos da Chapa',
  'MC': 'Mancais da Chapa',
  'IPM': 'Insertos Plug do Molde',
  'SUP': 'Suportes do Pistão',
  'CAP': 'Camisas do Pistão',
  'TB': 'Tubos do Pistão',
  'TP': 'Tampas do Pistão',
  'CE': 'Centralizadores',
  'PR': 'Parafusos',
  'HP': 'Hastes do Pistão',
  'PRO': 'Prolongadores',
  'IG': 'Insertos Gaveta',
  'BMC': 'Bases P Máquina Chuda',
  'CAI': 'Calços Injetor',
  'VA': 'Válvulas',
  'HV': 'Hastes para Válvula',
  'TE': 'Tampas Eixo',
  'BG': 'Buchas de Guia',
  'BR': 'Buchas Roscadas',
  'TI': 'Tampas do Inserto',
  'IPF': 'Insertos Plug Fundo',
};

/**
 * Obtém o nome descritivo do prefixo
 */
export function getPrefixName(prefix: string): string {
  return PREFIX_NAMES[prefix] || prefix;
}

/**
 * Extrai o prefixo (TIPO) do código do produto
 * Exemplos:
 * - "MO-01655-D" -> "MO"
 * - "AG-GL18A-V.S" -> "AG"
 * - "NR-P24B-V.SWN" -> "NR"
 */
export function extractPrefix(productCode: string): string {
  if (!productCode) return 'OUTROS';
  
  const match = productCode.match(/^([A-Z]+)-/);
  if (match) {
    return match[1];
  }
  
  // Fallback: pegar até o primeiro hífen
  const parts = productCode.split('-');
  return parts[0] || 'OUTROS';
}
